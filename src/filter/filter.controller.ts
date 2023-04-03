import {
  Controller,
  Get,
  Query,
  Res,
  Req,
  ParseIntPipe,
  DefaultValuePipe,
  Render,
  UseGuards,
} from "@nestjs/common";
import { Response } from "express";
import { FilterService } from "./filter.service";
import { reformPostDate } from "../../views/static/js/filter";
import { OptionalAuthGuard } from '../auth/optionalAuth.guard';
import { searchType, SearchResults, PaginatedResult } from './searchFilter'

@Controller("search")
export class FilterController {
  constructor(private filterService: FilterService) {}

  // 모든 게시물, 유저 검색
  @Get("all")
  @UseGuards(OptionalAuthGuard)
  @Render('searchAll')
  async searchAllPosts(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query() term,
    @Res() res: Response,
  ): Promise<any> {
      const terms = await this.filterService.findAllPosts(term);
      const events = terms.events;
      const clubs = terms.clubs;
      const users = terms.users;
      const results = { term, events, clubs, users, reformPostDate };
      
      return {
        ...results,
      }
  }
    // 유저 검색
    @Get("users")
    @UseGuards(OptionalAuthGuard)
    @Render("userSearch.ejs")
    async searchUsers(
      @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query() term,
    ): Promise<SearchResults> {

      try {
        const userData: PaginatedResult = await this.filterService.paginatedResults(
          searchType.users,
          page,
          term,
        );
        return {
          term,
          page,
          slicedData: userData.slicedData,
          searchCount: userData.searchCount,
          totalPages: userData.lastPage,
          unitStart : userData.unitStart,
          unitEnd : userData.unitEnd,
          lastPage : userData.lastPage,
          reformPostDate,
          
        };
      } catch (err) {
        console.error(err.message);
      }
    }
}