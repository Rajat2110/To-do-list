const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");

const app = express();
const mongoose = require("mongoose");

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//connecting to the database
main().catch(err => console.log(err)); 
async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/todolistDB');
}

//creating the schema for items
const itemsSchema = {
    name: String
};

const Item = new mongoose.model("Item", itemsSchema); //creating the model

const item1 = new Item({
    name: "Welcome to your to-do-list!"            //default list item
});

const item2 = new Item({
    name: "Hit the + button to add new item"          
});

const item3 = new Item({
    name: "<-- Hit this to delete an item"        
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = new mongoose.model("List", listSchema);

app.get("/", (req, res) => {

    Item.find({})
        .then(foundItems => {
            
            if(foundItems.length === 0){
                Item.insertMany(defaultItems)
                .then(result => {
                    console.log("items inserted successfully!")
                })
                .catch(err => {
                    console.log(err)
                }); 
                res.redirect("/");
            } else{
                res.render("list", {listTitle: "Today", newListItems: foundItems});
            }

        })
        .catch(err => {
            console.log(err);
        });

    
})

app.get("/:customListName", (req, res) => {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName})
        .then(foundList => {
            if(!foundList){
                //Create a new list
                const list = new List({
                name: customListName,
                items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            }else{
                //Show an existing list
                res.render("list", {listTitle: foundList.name, newListItems: foundList.items} );
            }
        })
        .catch( err => {
            console.log(err);
        })


});

app.post("/", (req, res) => {
    const itemName = req.body.newItem;
    const listName = req.body.list;
    
    const item = new Item({
        name: itemName
    });

    if( listName == "Today" ){
        item.save();
        res.redirect("/");
    }else{
        List.findOne({name: listName})
            .then(foundList => {
                foundList.items.push(item);
                foundList.save();
                res.redirect("/" + listName);
            })
            .catch(err => {
                console.log(err);
            })
    }
});

app.post("/delete", (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today"){
        Item.findByIdAndRemove(checkedItemId)
        .then( result => {
            console.log("Item removed Successfully!");
            res.redirect("/");
        })
        .catch( err => {
            console.log(err);
        })
    }else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}})
            .then(foundList => {
                res.redirect("/" + listName);
            })
            .catch(err => {
                console.log(err);
            });
    }    
});

app.listen(3000, function(){
    console.log("Server started at port 3000");
})