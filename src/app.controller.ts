import { Controller, Get, Inject, Res, Render, UseGuards, Req } from "@nestjs/common";
import { Response } from "express";
import { FilterService } from "./filter/filter.service";
import { reformPostDate } from "../views/static/js/filter";
import { OptionalAuthGuard } from './auth/optionalAuth.guard';

@Controller()
export class AppController {
  constructor(
    @Inject(FilterService)
    private readonly filterService: FilterService,
  ) {}

  @Get("/")
  @UseGuards(OptionalAuthGuard)
  @Render("mainbody")
  async mainpage() {
    const sortPosts = await this.filterService.getPopularPosts();
    const usersRank = await (await this.filterService.getUserRank()).slice(0, 5)
    return {
      sortPosts,
      reformPostDate,
      usersRank,
    };
  }

  @Get("sign")
  @UseGuards(OptionalAuthGuard)
  signin(
    @Res() res: Response,
    @Req() req
    ) {
    let buttonUserId = null;
    if (req.user) {
      buttonUserId = req.user;
    }
    return res.render("sign", {buttonUserId});
  }

  @Get("find_id_password")
  @UseGuards(OptionalAuthGuard)
  findpassword(
    @Res() res: Response,
    ) {
    return res.render("findpassword");
  }

  @Get("comment")
  comment(@Res() res: Response) {
    return res.render("comment");
  }

  @Get("mypage")
  @UseGuards(OptionalAuthGuard)
  mypage(
    @Res() res: Response,
    ) {
    return res.render("userinfo");
  }
}
