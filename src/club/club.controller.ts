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
  UnauthorizedException,
} from "@nestjs/common";
import { ClubService } from "./club.service";
import { CreateClubDto } from "./dto/createclub.dto";
import { UpdateClubDto } from "./dto/updateclub.dto";
import { Response } from "express";
import { CreateAppDto } from "./dto/createApp.dto";
import { ReportClubDto } from "./dto/reportclub.dto";
import { FilterService } from "src/filter/filter.service";
import {
  reformPostDate,
  paginatedResults,
  reformPostDateRaw,
} from "../../views/static/js/filter"; //날짜처리, 페이지네이션
import { AuthGuard } from "@nestjs/passport";
import { OptionalAuthGuard } from "../auth/optionalAuth.guard";
import { MailService } from "src/mail/mail.service";
import { searchType, SearchResults } from "src/filter/searchFilter";

@Controller("club")
export class ClubController {
  constructor(
    private readonly clubService: ClubService,
    private readonly filterService: FilterService,
    private readonly mailService: MailService,
  ) { }

  @Get("/list")
  @UseGuards(OptionalAuthGuard)
  async getClubs(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Res() res: Response,
    @Req() req
  ) {
    const clubs = await this.clubService.getClubs();
    const pagingposts = await paginatedResults(page, clubs);
    const sortPosts = await this.filterService.getPopularClubs();

    return res.render("club.ejs", {
      ...pagingposts,
      sortPosts,
      reformPostDate,
    });
  }

  @Get("/clubspost")
  @UseGuards(AuthGuard())
  async postclub(@Res() res: Response, @Req() req) {
    const userId = req.user;
    console.log("유저넘버", userId);
    return res.render("clubspost.ejs", {
      userId,
    });
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
    return post
  }

  @Post("/:id")
  @UseGuards(AuthGuard())
  async createApp(
    @Param("id") id: number,
    @Body() data: CreateAppDto,
    @Req() req,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('로그인 후 이용 가능한 기능입니다.');
    }
    console.log("모임신청 컨트롤러")
    const userId = req.user;
    const createNew = await this.clubService.createApp(
      id,
      userId,
      data.application,
      false,
    );
    
    return createNew;
  }

  @Get("/clubs/:id")
  @UseGuards(OptionalAuthGuard)
  async updateclub(
    @Param("id") id: number,
    @Res() res: Response
  ) {
    const detail = await this.clubService.getClubById(id);
    const nowPost = detail.nowPost
    return res.render("clubupdate.ejs", { nowPost, detail});
  }

  @Put("/clubs/:id")
  @UseGuards(OptionalAuthGuard)
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
    return update;
  }

  @Get("/list/:id")
  @UseGuards(OptionalAuthGuard)
  @Render("clubsdetail.ejs")
  async getClubsById(@Param("id") id: number, @Req() req) {
    
    const userId = req.userId;
    const detail = await this.clubService.getClubById(id);
    const prevPost = detail.prevPost;
    const nowPost = detail.nowPost;
    const nextPost = detail.nextPost;
    const comments = detail.comments;
    const postSet = { prevPost, nowPost, nextPost, comments, reformPostDate }
    const acceptedMember = await this.clubService.getClubMember(id);
    return {
      ...postSet,
      ...acceptedMember,
      reformPostDateRaw,
      userId,
    }
  };


  @Delete("/list/:id")
  @UseGuards(AuthGuard())
  async delete(@Param("id") id: number, @Req() req) {
    const userId = req.user;
    await this.clubService.deleteClub(userId, id);
    return true
  }

  @Get("/search") 
  @UseGuards(OptionalAuthGuard)
  @Render("clubsearch")
  async searchClubs(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query() term: string,
    @Query("searchOption") searchOption: string,
    @Res() res: Response,
  ) : Promise<SearchResults> {
    if (!page) {
      page = 1;
    }
    let pageType
    if (searchOption === "titleAndContent") {
      pageType = searchType.clubsTitleContent
    } else if (searchOption === "title") {
      pageType = searchType.clubsTitle
    }
    const searchData = await this.filterService.paginatedResults(
      pageType,
      page,
      term,
    );
    return {
      page,
      term,
      ...searchData,
      reformPostDate,
      searchOption
    };
  }
  @Post("/report/:id")
  @UseGuards(AuthGuard())
  async reportClub(
    @Param("id") id: number,
    @Body() data: ReportClubDto,
    @Req() req,
  ) {

    const userId = req.user;
    const createReport = await this.clubService.reportClub(
      id,
      userId,
      data.reportContent,
      data.reportReason,
    );
    return createReport;
  }
}
