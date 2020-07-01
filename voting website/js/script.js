//initialize materialize code
document.addEventListener("DOMContentLoaded", function () {
  // side navigation
  const sidenavElems = document.querySelectorAll(".sidenav");
  M.Sidenav.init(sidenavElems);

  //   slider
  const slider = document.querySelector(".slider");
  M.Slider.init(slider, {
    indicators: false,
    height: 400,
    transition: 1000,
    interval: 5000,
  });

  //modal
  const modalElems = document.querySelector(".modal");
  const modalInstances = M.Modal.init(modalElems, {
    endingTop: "25%",
  });
});

const categoryBtns = document.querySelectorAll(".category-boxes");
categoryBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    /*when the users chooses a category, save the data-target in the local storage,
      this is used to determine which firestore collection to use*/
    localStorage.setItem("category", btn.dataset.target);
    btn.href = "voting.html";
  });
});
//var that checks if option elements were created
let artistsAdded = false;

/*only call the database if there is a key of category in the local storage; prevents
  errors in the console*/
if (localStorage.getItem("category")) {
  //listen for updates
  // get the collection name from local storage
  database
    .collection(localStorage.getItem("category"))
    .onSnapshot((snapshot) => {
      let retrieved = [];
      snapshot.forEach((doc) => {
        //store each object in an array
        retrieved.push(doc.data());
        //dont create new option elements if options were already added
        if (artistsAdded == false) {
          addArtists(doc);

          // update the graph name
          const graphName = document.querySelector("#graph-name");
          graphName.innerHTML = `Live ${localStorage.getItem(
            "category"
          )} Musician Rankings`;
        }
      });

      // chart scripting below
      /*if there is already a chart then dremove that chart. if not destroyed it creates a
    bug when the data is update(when the user votes)*/
      if (window.chart != undefined) {
        window.chart.destroy();
      }
      const ctx = document.getElementById("myChart").getContext("2d");
      window.chart = new Chart(ctx, {
        // The type of chart we want to create
        type: "bar",
        // The data for our dataset
        data: {
          // set the labels to an array containing the names of each doc from retrieved
          labels: retrieved.map((ret) => ret.name),
          datasets: [
            {
              label: "Best RnB Musician",
              backgroundColor: "#9c0700",
              hoverBorderWidth: "2",
              borderColor: "#00adb5",
              // set the data to an array containing the votes of each doc from retrieved
              data: retrieved.map((ret) => ret.votes),
            },
          ],
        },
        // Configuration options go here
        options: {
          responsive: true,
          maintainAspectRatio: false,
          aspectRatio: 1,
          scales: {
            yAxes: [
              {
                ticks: {
                  //set the y-axis to start at 0
                  beginAtZero: true,
                },
              },
            ],
          },
          //dont show the legend
          legend: {
            display: false,
          },
        },
      });
      /*update the artistsAdded var to true because all the necessary options are inserted at
    the first load*/
      artistsAdded = true;
    });
}

//function to create options for the musicians in firstore
function addArtists(doc) {
  const list = document.querySelector("#list");
  const option = document.createElement("option");

  //set the img and data-id to the corresponding name and id of the firstore document
  option.setAttribute("data-icon", `./images/${doc.data().name}.jpg`);
  option.setAttribute("data-id", doc.id);
  option.textContent = doc.data().name;

  //add option to html between the select elements
  list.appendChild(option);

  //initialize materialize form
  const formElems = document.querySelectorAll("select");
  const formInstances = M.FormSelect.init(formElems);
}

const btn = document.querySelector("#vote-btn");
/*only add the event listener if there is a key of category in the local storage; prevents
  errors in the console*/
if (btn) {
  btn.addEventListener("click", submitVote);
  //function for when the sumbit my vote button is clicked
  function submitVote() {
    const list = document.querySelector("#list");
    const modalText = document.querySelector("#modal-text");
    const name = list.value;
    let id;

    //if no musician was selected then alert the user
    if (name == "") {
      modalText.innerHTML = "Please Choose A Musician, Then Submit Your Vote.";
    } else {
      /*if the user selected a musician:
          -update modal text; 
          -loop through all the options, if the innerHTML of any of the
           options are the same as the select elems' value, save the id of that option*/
      modalText.innerHTML = "Vote Successfully Placed";
      const options = document.querySelectorAll("option");

      /*if the innerHTML of any of the options match the name that was selected, save
        the data-id of that option*/

      options.forEach((option) => {
        if (option.innerHTML == name) {
          id = option.dataset.id;
        }
      });
      /* increase the votes in the database for the selected musician;
        uses the id to match the correct musician*/
      database
        .collection(localStorage.getItem("category"))
        .doc(id)
        .update({
          votes: firebase.firestore.FieldValue.increment(1),
        });
      //  disable the voting button and remove the collection name from the local storage
      btn.classList.add("disabled");
      localStorage.removeItem("category");
    }
  }
}
