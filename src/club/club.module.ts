import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Clubs } from "src/entities/clubs.entity";
import { Users } from "src/entities/users.entity";
import { ClubMembers } from "src/entities/clubmembers.entity";
import { ClubController } from "./club.controller";
import { ClubService } from "./club.service";
import { SearcherService } from "src/searcher/searcher.service";
import { SearcherRepository } from "src/searcher/searcher.repository";
import { ClubRepository } from "./club.repository";
import { EventPosts } from "src/entities/events.entity";
import { AbusingClubCounts } from "src/entities/abusingclubcounts.entity";
import { ClubCommentService } from "src/comments/clubcomment/clubcomment.service";
import { ClubCommentRepository } from "src/comments/clubcomment/clubcomment.repository";
import { ClubComments } from "src/entities/clubcomments.entity";
import { ClubCommentLikes } from "src/entities/clubcommentlikes.entity";
import { PassportModule } from "@nestjs/passport";
import { MailService} from "src/mail/mail.service"

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Clubs,
      Users,
      ClubMembers,
      EventPosts,
      AbusingClubCounts,
      ClubComments,
      ClubCommentLikes,
    ]),
    PassportModule.register({
      defaultStrategy: "jwt",
    }),
  ],
  controllers: [ClubController],
  providers: [
    ClubService,
    ClubRepository,
    SearcherService,
    SearcherRepository,
    ClubCommentService,
    ClubCommentRepository,
    MailService
  ],
  exports: [
    ClubService,
    ClubRepository,
    ClubCommentService,
    ClubCommentRepository,
  ],
})
export class ClubModule {}
