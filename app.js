document.addEventListener("DOMContentLoaded", () => {
  class Grid {
    constructor() {
      this.color = "white";
      this.limit = 25;
      this.elements = document.getElementsByClassName("gridElement");
    }

    create() {
      const grid = document.getElementById("grid");

      // Fill the grid with elements
      for (let i = 0; i < this.limit * this.limit; i++) {
        const div = document.createElement("div");
        div.setAttribute("class", "gridElement");
        grid.appendChild(div);
      }
    }
  }

  class Player {
    constructor() {
      this.color = "blue";
      this.index = 412;
      this.previousIndex = this.index;
      this.moved = false;
      this.gameOver = false;
    }

    create() {
      grid.elements[this.index].style.backgroundColor = this.color;
    }

    move(e) {
      if (opponent.moveOpponent === false) player.announceGameOver();
      if (player.gameOver === true) return;

      // Increment the grid element by key code
      switch(e.keyCode) {
        case 37:
          if (player.index % grid.limit === 0) {
            player.index += grid.limit - 1;
          } else player.index -= 1;
          break;

        case 38:
          if (player.index <= grid.limit - 1 && player.index >= 0) {
            player.index += (grid.limit * grid.limit) - grid.limit;
          } else player.index -= grid.limit;
          break;

        case 39:
          if (player.index % grid.limit >= grid.limit - 1) {
            player.index -= grid.limit - 1;
          } else player.index += 1;
          break;

        case 40:
          if (player.index >= (grid.limit * grid.limit) - grid.limit) {
            player.index -= (grid.limit * grid.limit) - grid.limit;
          } else  player.index += grid.limit;
          break;
      }

      // Erase previous iteration
      if (!obstacle.coordinates.includes(player.index) && !opponent.route.path.includes(player.index)) {
        grid.elements[player.index].style.backgroundColor = grid.color;
      } else grid.elements[player.index].style.backgroundColor = obstacle.color;

      // Prevent player from crossing the obstacle
      if (obstacle.coordinates.includes(player.index)) {
        player.index = player.previousIndex;
        return grid.elements[player.index].style.backgroundColor = player.color;
      }

      // Prevent player from moving through opponent
      if (player.index === Number(opponent.index)) player.announceGameOver();
      else {
        if (player.moved === false) {
          opponent.route.path.pop();
          opponent.route.path.push(player.previousIndex.toString());
          opponent.route.path.push("finish");
          player.moved = true;
        }

        // Draw the new grid element
        grid.elements[player.index].style.backgroundColor = player.color;

        opponent.route.path.pop();
        opponent.route.path.push(player.index.toString());

        grid.elements[player.previousIndex].style.backgroundColor = opponent.pathColor;

        player.previousIndex = player.index;

        opponent.route.path.push("finish");
      }
    }

    announceGameOver() {
      clearInterval(opponent.id);
      grid.elements[opponent.index].style.backgroundColor = grid.color;
      grid.elements[player.index].style.backgroundColor = opponent.color;
      player.gameOver = true;
      opponent.moveOpponent = true; // prevents second alert if player moves

      setTimeout(function() {
        alert("Game over");
      }, 100);
    }
  }

  class Opponent {
    constructor() {
      this.color = "green";
      this.index = null;
      this.previousIndex = this.index;
      this.graph = {};
      this.pathColor = "orange";
      this.moveOpponent = true;
      this.route = null;
      this.itr = 1;
      this.id = null;

      this.move = this.move.bind(this);
    }

    create() {
      this.index = 187;
      grid.elements[this.index].style.backgroundColor = this.color;
    }

    gridToObject() {
      const array = [];
      const l = grid.elements.length;
      const l_ = obstacle.coordinates.length;

      for (let i = 0; i < l; i++) {
        let object = {};

        const left = i - 1;
        const up = i - grid.limit;
        const right = i + 1;
        const down = i + grid.limit;

        object[i] = {};
        if (i % grid.limit != 0) object[i][left] = 1;
        if (i - (grid.limit - 1) > 0) object[i][up] = 1;
        if ((i + 1) % grid.limit != 0) object[i][right] = 1;
        if (i + grid.limit <= l) object[i][down] = 1;

        array.push(object);
      }

      // Transform the array into an object and pass it to find path
      const len = array.length;
      for (let i = 0; i < len; i++) this.graph[i] = array[i][i];
    }

    findPath() {
      // Put start and finish in graph
      for (let i in this.graph) {
        if (Number(i) === Number(this.index)) {
          this.graph["start"] = this.graph[i];
        }
        this.graph["finish"] = {};
      }

      const costs = Object.assign({finish: Infinity}, this.graph.start);
      const visited = [];
      const parents = {finish: null};

      for (let child in this.graph.start) parents[child] = "start";

      const findLow = function(costs, visited) {
        const known = Object.keys(costs);

        const lowCost = known.reduce((low, node) => {
          // Prevent the path from going through the obstacle
          if (obstacle.coordinates.includes(Number(node))) return low;

          if (!low && !visited.includes(node)) low = node;
          if (costs[low] > costs[node] && !visited.includes(node)) low = node;

          return low;
        }, null);

        return lowCost;
      }

      let node = findLow(costs, visited);
      while (node) {
        const costToNode = costs[node], children = this.graph[node];


        for (let child in children) {
          const fromNodeToChild = children[child];
          const costToChild = costToNode + fromNodeToChild;

          if (!costs[child] || costs[child] > costToChild) {
            if (Number(child) === player.index) costs["finish"] = costToChild;
            costs[child] = costToChild;
            parents[child] = node;
          }
        }

        visited.push(node);
        node = findLow(costs, visited);
      }

      const optimalPath = ["finish"];
      let parent = parents[player.index];

      while (parent) {
        optimalPath.push(parent);
        parent = parents[parent];
      }
      optimalPath.reverse();

      const result = { distance: costs.finish, path: optimalPath };

      this.route = result;
      this.printRoute();
    }

    printRoute() {
      const l = this.route.path.length;
      for (let i = 0; i < l; i++) {
        if (grid.elements[this.route.path[i]]) {
          grid.elements[ Number(this.route.path[i]) ].style.backgroundColor = this.pathColor;
        }
      }

      this.id = setInterval(this.move, 200);
    }

    move() {
      if (this.moveOpponent === false) {
        player.announceGameOver();

      } else {

        // Erase previous iteration
        const routeRemainder = this.route.path.slice(this.itr);
        if (!routeRemainder.includes(this.index)) {
          grid.elements[this.index].style.backgroundColor = grid.color;
          opponent.index = this.route.path[this.itr];
        } else if (routeRemainder.includes(opponent.index)) {
          grid.elements[this.index].style.backgroundColor = this.pathColor;
        }

        // Draw the new grid element
        if (grid.elements[this.route.path[this.itr]]) {
          grid.elements[this.route.path[this.itr]].style.backgroundColor = this.color;
          this.index = this.route.path[this.itr];
        }

        this.itr++;

        if (this.route.path[this.itr] === player.index.toString()) {
          this.moveOpponent = false;
        }
      }
    }
  }

  class Obstacle {
    constructor() {
      this.color = "gray";
      this.coordinates = [];
    }

    create() {
      for (let i = 280; i < 295; i++) this.coordinates.push(i);
      const l = this.coordinates.length;
      for (let i = 0; i < l; i++) {
        grid.elements[this.coordinates[i]].style.backgroundColor = this.color;
        grid.elements[this.coordinates[i]].setAttribute("obstacle", true);
      }
    }
  }

  const grid = new Grid;
  const player = new Player;
  const opponent = new Opponent;
  const obstacle = new Obstacle;

  grid.create();
  player.create();
  opponent.create();
  obstacle.create();

  opponent.gridToObject();
  opponent.findPath();

  document.addEventListener('keydown', player.move);
})
