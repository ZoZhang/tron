$(document).ready(function(){ 

    //La canvas
    var canvas = $("#canvas")[0],
        context = canvas.getContext("2d"),
        width = $("#canvas").width(), 
        height = $("#canvas").height();
        
    var cw = 10, // le size de cellule "tron"
        direction; //la direction du tron 

//initialisation sur l'eran
function init(){
    direction= "right"; //--- la direction  par défaut
    createTron();
    
    if(typeof gameLoop != "undefined"){
        clearInterval(gameLoop);
    }
  
    context.clearRect(0,0, width, height);

    //Dessin éléments de grille sur l'écran
    context.strokeStyle = "#eee";
    context.stroke();  
    gameLoop = setInterval(draw,130); //--Vitesse de "tron"                  
    
}

//initialisation du jeu
init();
    
//la création du tron (le remplissage de la tableau)
function createTron(){
    tronArray = [];
    //la création du tron dans le coin supérieur gauche de l'écran
    tronArray.push({x:0,y:0});    
}


    // Le algorithme de jeu 
    function draw(){
        var headTron; //le cellule qui contient les coordonnées du futur tete(moto) du tron
        
        //l'obtention de la position actuelle de la tete(moto) du tron
        var nx = tronArray[0].x,
            ny = tronArray[0].y;
        
        //on change la direction du tron en fonction de la valeur de la variable de "direction"(left|right|up|down)
        if(direction == "right"){
            nx++; 
        }else if(direction == "left"){
            nx--;    
        }else if(direction == "up"){ 
            ny--;
        }else if(direction == "down"){ 
            ny++;
        }
        
        //vérifions la collision du Tron avec lui-même ou avec les taille de la grille de canvas
        if(nx == -1 || nx == width/cw || ny == -1 || ny == height/cw || checkCollision(nx, ny, tronArray)){
            init();
            return;
        }
        else{
            //Si il y n'avait pas, créons une nouvelle cellule avec les nouvelles coordonnées
            headTron = {x:nx, y:ny}
            headTron.x = nx;
            headTron.y = ny;

            //Ajoute de cellule "headTron" au début de la tableaux tronArray
            tronArray.unshift(headTron);
        }
        
        //dessin de trajectoire de tron 
        for(var i = 0; i < tronArray.length; i++){
            var cell = tronArray[i];
            drawCells(cell.x, cell.y);
        }
    }
    
    //function pour trajectoire du tron
    function drawCells(x,y){
        context.fillStyle = "red"; //-- couleur de tron
        context.fillRect(x*cw, y*cw, cw, cw);
    }
    
    //vérification les zones de collision
    function checkCollision(x,y,array){
        for(var i = 0; i<array.length; i++){
            if(array[i].x == x && array[i].y == y) return true;
        }
        return false;
    }
    //Gestion des direction avec les boutons du clavier
    $(document).keydown(function(e){
        var key = e.which;
        if(key == "37" && direction!= "right") direction = "left";
        else if(key == "38" && direction!= "down") direction = "up";
        else if(key == "39" && direction!= "left") direction = "right";
        else if(key == "40" && direction!= "up") direction = "down";
        // Pour jouer avec дуыboutons du clavier ZQSD
        else if(key == "81" && direction!= "right") direction = "left";
        else if(key == "90" && direction!= "down") direction = "up";
        else if(key == "68" && direction!= "left") direction = "right";
        else if(key == "83" && direction!= "up") direction = "down";
    });



















//FIN
});