$(document).ready(function() {
  $("#render").click(function() {
    console.log($("#image").html());
    $(".news-img img").attr("src", $("#image").val());
    $(".tag").html(
      $("#tag")
        .val()
        .toUpperCase()
    );
    $(".headline").html($("#headline").val());
    $(".abstract").html($("#abstract").val());

    html2canvas(document.querySelector(".container"), {
      allowTaint: true,
      logging: true
    }).then(canvas => {
      $("#renderContainer").html(canvas);
    });
  });
});
