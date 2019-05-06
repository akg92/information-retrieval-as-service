

var populate = (data)=>{
    let div = $(".result_cls");
    div.empty();
    var sample =  ` <a href="#" class="list-group-item list-group-item-action flex-column align-items-start">
    <div class="d-flex w-100 justify-content-between">
      <h5 class="mb-1"></h5>
      <small class="text-muted"></small>
    </div>
  </a>`;
   // data = data['result']
    for (let i in data){
        let val = data[i];
        let child = $($.parseHTML(sample));
        child.find("h5").text(val.file_name);
        child.attr("href",'http://localhost:8080/'+val.file_id.replace("upload","content"));
        div.append(child);
        if(i>10){
            return;
        }
    }

}

var onenter = ()=>{

    let data = $("#search_box").val();
    data = {"query":data};
    data = JSON.stringify(data);
    //let algo_id=$(".dropdown .btn").text()||'conv1d';

   // $.post("/matching/?algo_id="+algo_id,data).done((resp)=>{
     //   resp=JSON.parse(resp);
       // populate(resp);
    //});
    $.get('http://localhost:8080/search', {query:data}, function (data, textStatus, jqXHR) {
    populate(data);
});


};
$(()=>{

      $(".dropdown-menu li a").click(function(){
  $(this).parents(".dropdown").find('.btn').html($(this).text() + ' <span class="caret"></span>');
  $(this).parents(".dropdown").find('.btn').val($(this).data('value'))});


      $(".search_icon").click(function(){
          onenter()
      });

    $(document).keypress(function(event){
	
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode == '13'){
            $(document).keypress(function(event){
	
                var keycode = (event.keyCode ? event.keyCode : event.which);
                if(keycode == '13'){
                    onenter();	
                }
                
            });
        }
        
    });
});