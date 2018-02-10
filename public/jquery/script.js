$(document).ready(function(){
    // cavhé le bouton et afficher le numéro
    $(".phoneNumberButtton").click(function(){
        //alert("click")
        $(".phoneNumberButtton").css("display","none");
        $(".phoneNumber").css("display","block");
    });

    $(".photoContainer").hover(function(){

    })
    // carrousel

    $(".photoContainer").click(function(){
        if ($("div.photoContainer > img:first-child").css("display") == "block"){
            
            $("div.photoContainer > img:first-child").css("display","none");
            $("div.photoContainer > img:nth-child(2)").css("display","block");
            $("div.photoContainer > img:nth-child(3)").css("display","none");    
        }
        else if ($("div.photoContainer > img:nth-child(2)").css("display") == "block"){
            
            $("div.photoContainer > img:first-child").css("display","none");
            $("div.photoContainer > img:nth-child(2)").css("display","none");
            $("div.photoContainer > img:nth-child(3)").css("display","block");    
        }
        else if ($("div.photoContainer > img:nth-child(3)").css("display") == "block"){
            
            $("div.photoContainer > img:first-child").css("display","block");
            $("div.photoContainer > img:nth-child(2)").css("display","none");
            $("div.photoContainer > img:nth-child(3)").css("display","none");    
        }
    })

    $(".btnConnet").click(function(){
        //if()
    })
    
})