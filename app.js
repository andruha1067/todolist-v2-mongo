//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// creates mongo DB local host server
mongoose.connect("mongodb+srv://admin-andrew:Test-123@cluster0.9z0ru.mongodb.net/todolistDB?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology: true });
//mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true });

const itemsSchema = {
  name: String
};

// creates items collection with specified schema
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}, {name: true, _id: true}, function(err, items) {
    if (err) {
      console.log(err);
    } else {
      if (items.length === 0) {
        Item.insertMany(defaultItems, function(err) {
          if (err) {
            console.log(err);
          } else {
            console.log("Successfully inserted default items.");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", {listTitle: "Today", newListItems: items});
      }
    } // end of else
  });
});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  // check if list with this name already exists
  List.findOne({name: customListName}, function(err, foundList) {
    //console.log(foundList);
    if (!err) {
      if (!foundList) {
        // Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();

        res.redirect("/" + customListName);

      } else {
        // Show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  });
});

app.post("/", function(req, res){
  const listName = req.body.list;
  const newItem = req.body.newItem;

  const item = new Item({
    name: newItem
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req,res) {
  const listName = req.body.listName;
  const checkedItemId = req.body.checkbox;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, {useFindAndModify: false}, function(err, checkedItem) {
      if (!err) {
        console.log("Successfully removed item name: ", checkedItem.name);
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, {useFindAndModify: false}, function(err, foundList) {
      if (!err) {
        console.log("Successfully removed item from list: ", foundList.name);
        res.redirect("/" + listName);
      }
    });
  }
})

app.listen(3000 || process.env.PORT, function() {
  console.log("Server started on port 3000");
});
