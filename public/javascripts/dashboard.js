// Cache selectors outside callback for performance. 
/* sticky menu
   var $window = $(window),
       $stickyEl = $('#memNav');
       elTop = $stickyEl.offset().top;

   $window.scroll(function() {
        $stickyEl.toggleClass('sticky', $window.scrollTop() > elTop);
    });*/
function deleteTask(id){
            
            $.get( "/deleteTask?id=" + id, function() {
                loadTasks();
            });
        }
        function loadTasks() {
            $.get( "/getTasks", function( data ) {
              
              var dataArray = JSON.parse(data);
              var htmlString = ""
              for(var i = dataArray.length - 1; i >= 0; --i){
                  
                  htmlString += "<div class='card-panel'><div class='np-padding-small'>" + dataArray[i] + 
                      "<div class='delete-button'><i class='material-icons'><a class='link-dark' href='javascript:;' onclick='deleteTask("+ i +")'>delete</a></i></div></div></div>";
                  
              }
              $( "#tasks" ).html( htmlString );
            });
            
        }
        
        function addTask(){
            
            var task = $("#task_field").val();
            $.get( "/addTask?t=" + task, function() {
                loadTasks();
            });
            
            
        }
        $(document).ready(function() {

          loadTasks();

        });
        
        $( "#tasksForm" ).submit(function( event ) {
            
            addTask();
            event.preventDefault();
            
        });