import {
  Body,
  Controller,
  Post,
  Param,
  Get,
  Delete,
  Patch,
  Res,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  Req,
  UploadedFile,
  UseInterceptors,
  Render,
  UseGuards,
  UnauthorizedException,
} from "@nestjs/common";
import { Response } from "express";
import { EventService } from "./event.service";
import { CreateEventDto } from "./dto/createevent.dto";
import { UpdateEventDto } from "./dto/updateevent.dto";
import { remindEmailDto } from "./dto/remindevent.dto";
import { FilterService } from "../filter/filter.service";
import * as AWS from "aws-sdk";
import { FileInterceptor } from "@nestjs/platform-express";
import { reformPostDate, paginatedResults } from "../../views/static/js/filter";
import { AuthGuard } from "@nestjs/passport";
import { OptionalAuthGuard } from '../auth/optionalAuth.guard';
import { ReportEventDto } from "./dto/reportevent.dto";
import { searchType} from "../filter/searchFilter"

@Controller("events")
export class EventController {
  constructor(
    private eventService: EventService,
    private filterService: FilterService,
  ) { }

  @Post("/remindEvent")
  @UseGuards(AuthGuard())
  async remindEvent(@Body() data: remindEmailDto, @Res() res) {
    const remindEvent = await this.eventService.remindEvent(
      data.email,
      data.startDate,
      data.endDate,
      data.title,
    );
    return res.json({ data: remindEvent });
  }

  @Post("/newevent")
  @UseGuards(OptionalAuthGuard)
  @UseInterceptors(FileInterceptor("file"))
  @UseGuards(AuthGuard())
  async createUser(
    @Req() req,
    @Res() res: Response,
    @Body() data: CreateEventDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    AWS.config.update({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
      },
    });
    const key = `${Date.now() + file.originalname}`;
    const upload = await new AWS.S3()
      .putObject({
        Key: key,
        Body: file.buffer,
        Bucket: process.env.AWS_BUCKET_NAME,
        ACL: "public-read",
      })
      .promise();

    const postIMG = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`;

    Object.assign({
      statusCode: 201,
      message: `이미지 등록 성공`,
      data: { url: postIMG },
    });

    const userId = req.user;

    const event = await this.eventService.createEvent(
      userId,
      data.title,
      data.content,
      data.startDate,
      data.endDate,
      postIMG,
    );
    return res.json(true);
  }

  @Get("/newevent")
  @UseGuards(OptionalAuthGuard)
  async getNewEvent(
    @Res() res: Response,
    @Req() req
  ) {
    let buttonUserId = null;
    if (req.user) {
      buttonUserId = req.user
      return res.render("eventNew.ejs", {
        buttonUserId
      });
    } else {
      res.send("<script>alert('로그인이 필요한 기능입니다.');history.back();;</script>");
    }
  }

  @Get("/list")
  @UseGuards(OptionalAuthGuard)
  async getEvent(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Res() res: Response,

  ) {
    const events = await this.eventService.getEvents();
    const pagingposts = await paginatedResults(page, events);
    const sortPosts = await this.filterService.getPopularEvents();

    return res.render("eventMain.ejs", {
      ...pagingposts,
      sortPosts,
      reformPostDate,
    });
  }

  @Get("/list/:id")
  @UseGuards(OptionalAuthGuard)
  @Render("eventDetail.ejs")
  async getEventById(
    @Param("id") id: number,
    @Req() req
  ) {
    let postDetail = await this.eventService.getEventById(id);
    const events = postDetail.data.nowPost;
    let imgUrl = events.postIMG;
    events.createdAt = new Date(events.createdAt);
    const prevPost = postDetail.data.prevPost;
    const nowPost = postDetail.data.nowPost;
    const nextPost = postDetail.data.nextPost;
    const comments = postDetail.comments;

    return {
      events,
      imgUrl,
      nextPost,
      nowPost,
      prevPost,
      comments,
      reformPostDate,
    };
  }

  @Get("/list/:id/updatepage")
  @UseGuards(OptionalAuthGuard)
  async getUpdateEvent(
    @Res() res: Response,
    @Param("id") id: number,
    @Req() req
  ) {
    let buttonUserId = null;
    if (req.user) {
      buttonUserId = req.user
    }
    const events = await this.eventService.getEventById(id);
    const event = events.data.event;
    let imgUrl = event.postIMG;

    return res.render("eventUpdate.ejs", { events, event, buttonUserId });
  }

  @Patch("/list/:id/update")
  @UseInterceptors(FileInterceptor("file"))
  @UseGuards(AuthGuard())
  async updateEvent(
    @Param("id") id: number,
    @Req() req,
    @Body() data: UpdateEventDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    AWS.config.update({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
      },
    });

    const key = `${Date.now() + file.originalname}`;
    const upload = await new AWS.S3()
      .putObject({
        Key: key,
        Body: file.buffer,
        Bucket: process.env.AWS_BUCKET_NAME,
        ACL: "public-read",
      })
      .promise();
    const postIMG = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`;

    const userId = req.user;
    const events = await this.eventService.updateEvent(id, {
      userId,
      title: data.title,
      content: data.content,
      startDate: data.startDate,
      endDate: data.endDate,
      postIMG: postIMG,
    });

    return events;
  }

  @Delete("/list/:eventPostId")
  @UseGuards(AuthGuard())
  async deleteArticle(@Param("eventPostId") eventPostId: number) {
    const deleteEvent = await this.eventService.deleteEvent(eventPostId);
    return true;
  }

  // 이벤트 게시글 검색기능
  @Get("/search")
  @UseGuards(OptionalAuthGuard)
  async searchEvents(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query() term: string,
    @Query("searchOption") searchOption: string,
    @Res() res: Response,
  ) {
    if (!page) {
      page = 1;
    }
    let pageType : searchType
    if (searchOption === "titleAndContent") {
      pageType = searchType.eventsTitleContent;
    } else if (searchOption === "title") {
      pageType = searchType.eventsTitle
    }
    const searchData = await this.filterService.paginatedResults(
      pageType,
      page,
      term,
    );

    return res.render("eventsearch.ejs", {
      page,
      term,
      ...searchData,
      reformPostDate,
      searchOption
    });
  }

  // @Get("/list/report")
  // @UseGuards(AuthGuard())
  // async report(@Res() res: Response, @Req() req) {
  //   const userId = req.user;
  //   console.log("유저넘버", userId);
  //   if (!userId) {
  //     return new UnauthorizedException("로그인 후 이용 가능한 기능입니다.");
  //   }
  //   console.log("유저넘버", userId);
  //   return userId;
  // }

  @Post("/report/:id")
  @UseGuards(AuthGuard())
  async reportEvent(
    @Param("id") id: number,
    @Body() data: ReportEventDto,
    @Req() req,
  ) {
    let buttonUserId = null;
    if (req.user) {
      buttonUserId = req.user;
    }
    const userId = req.user;
    const createReport = await this.eventService.reportEvent(
      id,
      userId,
      data.reportContent,
      data.reportReason,
    );
    return { createReport, buttonUserId };
  }
}
