import {
  Body,
  Param,
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Res,
  Req,
  UploadedFile,
  UseInterceptors,
  Redirect,
  UnauthorizedException,
  Query,
} from "@nestjs/common";
import { Response } from "express";
import { UserpageService } from "./userpage.service";
import { UseGuards } from "@nestjs/common";
import { UserUpdateDto } from "./dto/userpage.update.dto";
import { AuthGuard } from "@nestjs/passport";
import { Express } from "express";
import * as AWS from "aws-sdk";
import { FileInterceptor } from "@nestjs/platform-express";
import { PaginationDto } from "./dto/pagination.dto";
import { OptionalAuthGuard } from "../auth/optionalAuth.guard";

@Controller("userpage")
export class UserpageController {
  constructor(private readonly userPageService: UserpageService) {}

  @Get("/:userId")
  @UseGuards(OptionalAuthGuard)
  async getUserInfo(
    @Param("userId") userId: number,
    @Res() res: Response,
    @Req() req,
  ) {
    let buttonUserId = null;
    if (req.user) {
      buttonUserId = req.user;
      const currentUserId = req.user;
      if (!currentUserId) {
        return new UnauthorizedException("로그인 후 이용 가능한 기능입니다.");
      }
      const myInfo = await this.userPageService.getUserInfo(
        userId,
        currentUserId,
      );
      return res.render("userInfo", { myInfo, buttonUserId: currentUserId });
    } else {
      res.send(
        "<script>alert('로그인이 필요한 기능입니다.');history.back();;</script>",
      );
    }
  }

  @Get("/:userId/post")
  async getUserPost(
    @Param("userId") userId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    const { cursor, type } = paginationDto;

    // console.log("controller : ", userId, cursor, type);
    const myPosts = await this.userPageService.getMyPosts(userId, cursor, type);

    return { myPosts };
  }

  @Get("/:userId/clubs")
  @UseGuards(AuthGuard())
  async getUserClubs(@Param("userId") userId: number, @Req() req) {
    const currentUserId = req.user;
    if (!currentUserId) {
      throw new UnauthorizedException("로그인 후 이용 가능한 기능입니다.");
    }
    const myClubs = await this.userPageService.getMyClubs(userId);
    console.log(myClubs);
    return myClubs;
  }

  @Get("/:userId/edit")
  @UseGuards(AuthGuard())
  async editUserInfo(
    @Param("userId") userId: number,
    @Res() res: Response,
    @Req() req,
  ) {
    const currentUserId = req.user;
    console.log("유저?", currentUserId);
    if (currentUserId !== userId) {
      throw new UnauthorizedException("본인만 수정 가능합니다.");
    }
    const myInfo = await this.userPageService.getUserInfo(
      userId,
      currentUserId,
    );
    const context = { myInfo };
    return res.render("userInfoEdit", {
      ...context,
      buttonUserId: currentUserId,
    });
  }

  // multipart/form-data 로 submit할때는 method를 patch로 변경시, multer middleware를 수정해야 하는 문제가 있음
  @Post("/:userId/edit") // 내 정보 수정하기, 본인검증로직 추가할 것
  @UseGuards(AuthGuard())
  @UseInterceptors(FileInterceptor("userIMG"))
  @Redirect("", 302)
  async updateUser(
    @Param("userId") userId: number,
    @Req() req, // @Body() data: UserUpdateDto,
    @Body() data: UserUpdateDto,
    @UploadedFile() uploadedFile: Express.Multer.File,
  ) {
    console.log("수정");
    const currentUserId = req.user;
    if (currentUserId !== userId) {
      throw new UnauthorizedException("본인만 수정 가능합니다.");
    }

    const userInfo = await this.userPageService.getUserInfo(
      userId,
      currentUserId,
    );
    let imgUrl = userInfo.userIMG;

    if (!!uploadedFile) {
      AWS.config.update({
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY,
          secretAccessKey: process.env.AWS_SECRET_KEY,
        },
      });
      const key = `${Date.now() + uploadedFile.originalname}`;
      const upload = await new AWS.S3()
        .putObject({
          Key: key,
          Body: uploadedFile.buffer,
          Bucket: process.env.AWS_BUCKET_NAME,
          ACL: "public-read",
        })
        .promise();
      imgUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`;
    }
    Object.assign({
      statusCode: 201,
      message: `이미지 등록 성공`,
      data: { url: imgUrl },
    });

    const changedInfo = await this.userPageService.updateUser(
      userId,
      currentUserId,
      {
        email: data.email,
        password: data.password,
        phone: data.phone,
        nickName: data.nickName,
        snsUrl: data.snsUrl,
        userIMG: imgUrl,
      },
    );

    return {
      url: `/userpage/${userId}`,
    };
  }

  // 유저 신청서 조회
  @Get("/clubs/:userId/app")
  @UseGuards(OptionalAuthGuard)
  async getUserApps(@Param("userId") userId: number, @Res() res: Response) {
    const myApps = await this.userPageService.getClubApps(userId);
    return res.json(myApps);
  }

  @Get("/:userId/clubs/:clubId") // TODO 특정 클럽정보 조회
  @UseGuards(OptionalAuthGuard)
  async getThisClub(
    @Param("userId") userId: number,
    @Param("clubId") clubId: number,
    @Req() req,
  ) {
    let buttonUserId = null;
    if (req.user) {
      buttonUserId = req.user;
    }
    const thisClub = await this.userPageService.getThisClub(userId, clubId);
    return { thisClub, buttonUserId };
  }

  @Get("/:userId/clubs/app/:clubMemberId") // 특정 신청서 조회 (완료)
  @UseGuards(OptionalAuthGuard)
  async getThisApp(
    @Param("userId") userId: number,
    @Param("clubMemberId") clubMemberId: number,
    @Req() req,
  ) {
    let buttonUserId = null;
    if (req.user) {
      buttonUserId = req.user;
    }
    const thisApp = await this.userPageService.getThisApp(userId, clubMemberId);
    return { thisApp, buttonUserId };
  }

  @Patch("/:userId/clubs/app/:clubMemberId")
  @UseGuards(AuthGuard())
  async getThisMember(
    @Param("userId") userId: number,
    @Param("clubMemberId") clubMemberId: number,
    @Req() req,
  ) {
    let buttonUserId = null;
    if (req.user) {
      buttonUserId = req.user;
    }
    const thisMember = await this.userPageService.getThisMember(
      userId,
      clubMemberId,
    );
    return { thisMember, buttonUserId };
  }

  @Delete("/:userId/clubs/app/:clubMemberId")
  @UseGuards(AuthGuard())
  async rejectApps(
    @Param("userId") userId: number,
    @Param("clubMemberId") clubMemberId: number,
    @Req() req,
  ) {
    let buttonUserId = null;
    if (req.user) {
      buttonUserId = req.user;
    }
    const notThisApp = this.userPageService.rejectApp(userId, clubMemberId);
    return { notThisApp, buttonUserId };
  }
}
