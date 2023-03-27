import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Res,
  Req,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  Render,
  UseGuards,
} from "@nestjs/common";
import { ClubService } from "./club.service";
import { CreateClubDto } from "./dto/createclub.dto";
import { UpdateClubDto } from "./dto/updateclub.dto";
import { Response } from "express";
import { CreateAppDto } from "./dto/createApp.dto";
import { SearcherService } from "src/searcher/searcher.service";
import { ReportDefinition } from "aws-sdk/clients/cur";
import { reformPostDate, paginatedResults, reformPostDate2nd } from "../../views/static/js/filter"; //날짜처리, 페이지네이션
import { AuthGuard } from "@nestjs/passport";

@Controller("club")
export class ClubController {
  constructor(
    private readonly clubService: ClubService,
    private readonly searchService: SearcherService,
  ) {}

  @Get("/list")
  async getClubs(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Res() res: Response,
  ) {
    const clubs = await this.clubService.getClubs();
    const pagingposts = await paginatedResults(page, clubs);
    const sortPosts = await this.searchService.getPopularClubs();

    return res.render("club.ejs", {
      ...pagingposts,
      sortPosts,
      reformPostDate,
    });
  }

  @Get("/clubspost")
  postclub(@Res() res: Response) {
    return res.render("clubspost.ejs");
  }

  @Post("/clubspost")
  @UseGuards(AuthGuard())
  async createClub(@Body() data: CreateClubDto, @Req() req) {
    const userId = req.user;
    const post = await this.clubService.createClub(
      userId,
      data.title,
      data.content,
      data.maxMembers,
      data.category,
    );
    return post;
  }

  @Post("/:id")
  @UseGuards(AuthGuard())
  async createApp(
    @Param("id") id: number,
    @Body() data: CreateAppDto,
    @Req() req,
  ) {
    const userId = req.user;
    const createNew = await this.clubService.createApp(
      id,
      userId,
      data.application,
      data.isAccepted,
    );
    return createNew;
  }

  @Get("/clubs/:id")
  @UseGuards(AuthGuard())
  async updateclub(
    @Param("id") id: number, 
    @Res() res: Response,
    @Req() req,
    ) {
    let buttonUserId = null;
    if(req.user) {
      buttonUserId = req.user
    }
    const detail = await this.clubService.getClubById(id);
    const nowPost = detail.data.nowPost
    return res.render("clubupdate.ejs", {nowPost, detail, buttonUserId});
  }

  @Put("/clubs/:id")
  @UseGuards(AuthGuard())
  async updateClub(
    @Param("id") id: number,
    @Body() data: UpdateClubDto,
    @Req() req,
  ) {
    const userId = req.user;
    const update = await this.clubService.updateClub(
      id,
      userId,
      data.title,
      data.content,
      data.maxMembers,
      data.category,
    );
    return update
  }

  @Get("/list/:id")
  @UseGuards(AuthGuard())
  @Render("clubsdetail.ejs")
  async getClubsById(
    @Param("id") id: number,
    @Req() req
    ) {
      let buttonUserId = null;
      if(req.user) {
        buttonUserId = req.user
      }
    const detail = await this.clubService.getClubById(id);
    const prevPost = detail.data.prevPost
    const nowPost = detail.data.nowPost
    const nextPost = detail.data.nextPost
    const comments = detail.comments
    const postSet = {prevPost, nowPost, nextPost, comments, reformPostDate}
    const acceptedMember = await this.clubService.getClubMember(id);
    console.log(comments)
    return {
      ...postSet,
      ...acceptedMember,
      reformPostDate2nd,
      buttonUserId
      }
    };

  @Delete("/list/:id")
  @UseGuards(AuthGuard())
  async delete(@Param("id") id: number, @Req() req) {
    const userId = req.user;
    await this.clubService.deleteClub(userId, id);
    return true;
  }

  @Get("/search")
  async searchClubs(
    @Query("page") page: number,
    @Query() term: string,
    @Res() res: Response,
  ) {
    if (!page) {
      page = 1;
    }
    const searchData = await this.searchService.paginatedResults(
      "clubs",
      page,
      term,
    );
    return res.render("clubsearch.ejs", {
      term,
      ...searchData,
      reformPostDate,
    });
  }
}