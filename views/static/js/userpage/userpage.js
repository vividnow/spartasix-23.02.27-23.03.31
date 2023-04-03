// const { query } = require("express");

function modal_open1(userId) {
  $(`#Appmodal`).fadeIn();
  selectApp(userId);
  $(document).mouseup(function (e) {
    if ($(`#Appmodal`).has(e.target).length === 0) {
      $(`#Appmodal`).hide();

      window.location.reload();
    }
  });
}

function modal_open2() {
  $(`#Appmodal2`).fadeIn();
  $(document).mouseup(function (e) {
    if ($(`#Appmodal2`).has(e.target).length === 0) {
      $(`#Appmodal2`).hide();
      window.location.reload();
    }
  });
}
function userInfo(userId) {
  $.ajax({
    type: "GET",
    url: `/userpage/${userId}`,
    async: false,
    success: function (response) {
      window.location.href = `/userpage/${userId}`;
    },
    error: function (request) {
      if (request.responseJSON["message"] === "Unauthorized") {
        alert("로그인 후 이용 가능한 기능입니다.");
        window.location.replace(`/sign`);
      }
      if (request.responseJSON["message"] === "Unauthorized") {
        {
          $.ajax({
            type: "POST",
            url: "/auth/new-accessToken",
            success: function (response) {
              $.ajax({
                type: "PATCH",
                url: `/userpage/${userId}`,
                async: false,
                success: function (res) {
                  window.location.replace(`/userpage/${userId}`);
                },
              });
            },
          });
        }
      }
    },
  });
}

function selectApp(userId) {
  $.ajax({
    type: "GET",
    url: `/userpage/clubs/${userId}/app`,
    success: function (res) {
      let rows = res["myApps"];
      let full_html = "";

      for (let i = 0; i < rows.length; i++) {
        let nickname = rows[i]["nickName"];
        let clubMemberId = rows[i]["id"];
        let userId = rows[i]["userId"];
        let date = rows[i]["createdAt"];
        date = date.split("T")[0];
        console.log(res);
        let temp_html = `
        <div class="app_body_container" onclick="show_one_user(${userId}, ${clubMemberId}, '${nickname}');">
          <div class="member_name">
            <div class="member_body_name">
              ${clubMemberId}
            </div>
          </div>
          <div class="member_body">
            <div class="member_body_content">
              ${nickname}
            </div>
          </div>
          <div class="member_date">
            <div class="member_body_date">
              ${date}
            </div>
          </div>
        </div>
        `;
        full_html += temp_html;
      }

      $(".app_body").html(full_html);
    },
  });
}

function show_one_user(userId, clubMemberId, nickName) {
  $.ajax({
    type: "GET",
    url: `/userpage/${userId}/clubs/app/${clubMemberId}`,
    async: false,
    success: function (res) {
      console.log(res);
      let temp_html = `
      <div class="app_body2">
        <div class="app_body2_content">
          ${res.thisApp["application"]}
        </div>
		<div class="app_body2_from">
		  <span class="from_label">From</span>
		  <span class="nickname">${res.thisApp["nickName"]}</span>
		</div>
      </div>
      <div class="app_button2">
        <button type="button" class="app_btn app_btn_confirm" onclick="update_accepted(${userId}, ${clubMemberId})">Accept!</button>
        <button type="button" class="app_btn app_btn_reject" onclick="delete_accepted(${userId}, ${clubMemberId})">Mehh-</button>
      </div>
      `;
      $(".app_action").html(temp_html);
    },
  });
}

function update_accepted(userId, clubMemberId) {
  $.ajax({
    type: "PATCH",
    url: `/userpage/${userId}/clubs/app/${clubMemberId}`,
    async: false,
    success: function (res) {
      alert("수락 완료 !");
      window.location.reload();
    },
    error: function (request) {
      if (request.responseJSON["message"] === "회원이 존재하지 않습니다.") {
        alert("로그인 후 이용가능한 기능입니다.");
      }

      if (request.responseJSON["message"] === "Unauthorized") {
        $.ajax({
          type: "POST",
          url: "/auth/new-accessToken",
          success: function (response) {
            $.ajax({
              type: "PATCH",
              url: `/userpage/${userId}/clubs/app/${clubMemberId}`,
              async: false,
              success: function (res) {
                alert("수락 완료 !");
                window.location.reload();
              },
            });
          },
        });
      }
    },
  });
}

function delete_accepted(userId, clubMemberId) {
  $.ajax({
    type: "DELETE",
    url: `/userpage/${userId}/clubs/app/${clubMemberId}`,
    async: false,
    success: function (res) {
      alert("거절 완료 !");
      window.location.reload();
    },
    error: function (request) {
      if (request.responseJSON["message"] === "회원이 존재하지 않습니다.") {
        alert("로그인 후 이용가능한 기능입니다.");
      }

      if (request.responseJSON["message"] === "Unauthorized") {
        $.ajax({
          type: "POST",
          url: "/auth/new-accessToken",
          success: function (response) {
            $.ajax({
              type: "DELETE",
              url: `/userpage/${userId}/clubs/app/${clubMemberId}`,
              async: false,
              success: function (res) {
                alert("거절 완료 !");
                window.location.reload();
              },
            });
          },
        });
      }
    },
  });
}
function show_clubPosts(userId, type) {
  // cursor
  let cursor = "";
  if (type === "clubNext") {
    cursor = $("#club-post-wrap:last-child").attr("data-index");
  }
  if (type === "clubPrev") {
    cursor = $("#club-post-wrap:first-child").attr("data-index");
  }
  $.ajax({
    type: "GET",
    url: `/userpage/${userId}/post?cursor=${cursor}&type=${type}`,
    async: true,
    success: function (res) {
      $(".club-posts").empty();

      const { myClubPosts } = res.myPosts;
      let full_html = "";
      for (const clubPost of myClubPosts) {
        console.log(clubPost);
        let postHtml = `
          <div id='club-post-wrap' data-index=${clubPost.id}>
            <div class="post-title">
              ${clubPost.title}
            </div>
            <div class="post-content">
              ${clubPost.content}
        
            </div>
          </div>`;

        full_html += postHtml;
        full_html += `</div>`;
      }
      $(".club-posts").append(full_html);
    },
    error: function (request) {
      console.log(request);
      if (request.status === 404) {
        alert("다음 글이 존재하지 않습니다.");
      }
    },
  });
}

function show_eventPosts(userId, type) {
  let cursor = "";
  if (type === "eventNext") {
    cursor = $("#event-post-wrap:last-child").attr("data-index");
  }
  if (type === "eventPrev") {
    cursor = $("#event-post-wrap:first-child").attr("data-index");
  }

  $.ajax({
    type: "GET",
    url: `/userpage/${userId}/post?cursor=${cursor}&type=${type}`,
    async: true,
    success: function (res) {
      $(".event-posts").empty();
      const { myEventPosts } = res.myPosts;
      let full_html = "";
      for (const eventPost of myEventPosts) {
        let postHtml = `
        <div id='event-post-wrap' data-index=${eventPost.id}>
          <div class="post-title">
            ${eventPost.title}
          </div>
        </div>`;

        full_html += postHtml;
        full_html += `</div>`;
      }

      $(".event-posts").append(full_html);
    },
    error: function (request) {
      console.log(request);
      if (request.status === 404) {
        alert("다음 글이 존재하지 않습니다.");
      }
    },
  });
}

function editInfo(userId) {
  $.ajax({
    type: "get",
    url: `/userpage/${userId}/edit`,
    async: true,
    success: function (response) {
      window.location.replace(`/userpage/${userId}/edit`);
    },

    error: function (request) {
      if (request.responseJSON["message"] === "본인만 수정 가능합니다.") {
        alert("본인만 수정 가능합니다.");
        $.ajax({
          type: "GET",
          url: `/userpage/${userId}`,
          async: false,
          success: function (response) {
            next;
          },
        });
      }

      if (request.responseJSON["message"] === "토큰이 만료되었습니다.") {
        alert("다시 로그인하세요.");
        window.location.replace(`/sign`);
        $.ajax({
          type: "POST",
          url: "/auth/new-accessToken",
          success: function (response) {
            $.ajax({
              type: "PATCH",
              url: `/userpage/${userId}`,
              async: false,
              success: function (res) {
                window.location.replace(`/userpage/${userId}`);
              },
            });
          },
        });
      }
    },
  });
}

function checkClubs(userId) {
  $.ajax({
    type: "get",
    url: `/userpage/${userId}/clubs`,
    async: true,
    success: function (res) {
      let { myOwnClub, MyClub } = res;
      let rows = [];
      console.log(myOwnClub);
      let full_html = "";
      rows = myOwnClub;
      full_html += `
      <p style="font-family: Alfa Slab One, sans-serif; font-size: 26px">
      <br /> My Clubs
    </p>
     
        `;
      for (let i = 0; i < rows.length; i++) {
        full_html += `<div class = "myOwnClub">`;
        let title = rows[i]["title"];
        let temp_html = `
            <font style="color: #ea4e4e; size: 20px">
             ${title} </font>
       <br /> `;

        full_html += temp_html;
        full_html += `</div>`;
      }

      rows = MyClub;
      full_html += `
      <p style="font-family: Alfa Slab One, sans-serif; font-size: 26px">
      <br /> I'm in     </p>
       `;
      for (let i = 0; i < rows.length; i++) {
        full_html += `<div class = "MyClub">`;

        let title = rows[i]["title"];
        let temp_html = `
        <font style="color: #ea4e4e; size: 20px">
        ${title} </font>
       <br /> `;

        full_html += temp_html;
        full_html += `</div>`;
      }
      // $("#myClubAct").html(full_html);
      $(".myClubAct").append(full_html);
    },
  });
}
