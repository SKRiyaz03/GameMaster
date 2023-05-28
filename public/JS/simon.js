var buttonColors = ["red", "blue", "green", "yellow"];
var gamePattern = [];
var userClickedPattern = [];
var level = 0;
$(document).on("keypress",function(){
    if(level == 0)
        nextSequence();
});
$(".btn").on("click", function(event){
    // var buttonId = event.target.id;
    var buttonId = $(this).attr("id");
    userClickedPattern.push(buttonId);
    playSound(buttonId);
    playAnimation(buttonId);
    checkAnswer(userClickedPattern.length - 1); 
});
function checkAnswer(currLevel){
    if(userClickedPattern[currLevel] != gamePattern[currLevel]){
        RestartGame();
    }
    else if(gamePattern.length == userClickedPattern.length){
        // console.log("Total Win");
        setTimeout(function(){
            nextSequence();
        }, 1000);
        // nextSequence();
    }
}
function RestartGame(){
    gamePattern = [];
    playSound("wrong");
    $("body").addClass("game-over");
    setTimeout(function(){
        $("body").removeClass("game-over");
    },500);
    $("h1").html("Game Over, Press Any Key to Restart");
    const xhr = new XMLHttpRequest();
    const url = "/player/update";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            console.log(xhr.responseText);
        }
    };
    const data = JSON.stringify({   
        gameName: "simon",
        score: level
    });
    console.log(data);
    xhr.send(data);
    level = 0;
}
function playAnimation(name){
    // $("#" + name).addClass("pressed").delay(1000).removeClass("pressed");
    // $("#" + name).addClassTemporarily("pressed", 1000);
    $('#' + name).addClass("pressed");
    setTimeout(function(){
        $("#" + name).removeClass("pressed");
    }, 70);
}
function playSound(name){
    var audio = new Audio("/simonSounds/" + name + ".mp3");
    audio.play();
}
function nextSequence(){
    var RandomNumber = Math.floor(Math.random() * 4);
    gamePattern.push(buttonColors[RandomNumber]);
    $('#' + buttonColors[RandomNumber]).fadeIn(100).fadeOut(100).fadeIn(100);
    playSound(buttonColors[RandomNumber]);
    $('h1').html("level " + level);
    // console.log(level);
    level++;
    userClickedPattern = [];
}