const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

let login = false;

mongoose.set("strictQuery", false);
mongoose.connect(
    "mongodb+srv://longtk26:2662003@cluster0.9phv87c.mongodb.net/todolistDB?retryWrites=true&w=majority"
);

//Schema
const itemsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
});

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema],
});

//Model

const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

const learnJs = new Item({ name: "learnJs" });
const learnReact = new Item({ name: "learnReact" });
const learnNode = new Item({ name: "learnNode" });

const defaultItems = [learnJs, learnReact, learnNode];

const getDefaultItems = async (res) => {
    try {
        const items = await Item.find();

        if (items.length === 0 && !login) {
            Item.insertMany(defaultItems, (err) => {
                err
                    ? console.error(err)
                    : console.log("Successfully inserted!");
            });
        }
        login = true;
        res.render("list", { listTitle: "Today", items: items });
    } catch (error) {
        console.log(error);
    }
};

app.get("/", (req, res) => {
    getDefaultItems(res);
});

app.get("/about", (req, res) => {
    res.render("about");
});

app.get("/:anotherList", (req, res) => {
    const customeList = _.capitalize(req.params.anotherList);

    List.findOne({ name: customeList }, (err, result) => {
        if (!result) {
            const list = new List({
                name: customeList,
                items: defaultItems,
            });
            list.save();
            res.redirect(`/${customeList}`);
        } else {
            res.render("list", { listTitle: result.name, items: result.items });
        }
    });
});

app.post("/", (req, res) => {
    const itemName = req.body.job;
    const listName = req.body.list;

    const newItem = new Item({ name: itemName });

    if (listName === "Today") {
        if (itemName) {
            newItem.save();
        }
        res.redirect("/");
    } else {
        List.findOne({ name: listName }, (err, foundList) => {
            foundList.items.push(newItem);
            foundList.save();
            res.redirect(`/${listName}`);
        });
    }
});

app.post("/delete", (req, res) => {
    const idWork = req.body.id;
    const listName = req.body.list;

    if (listName === "Today") {
        Item.deleteOne({ _id: idWork }, (err) => {
            if (err) {
                console.error(err);
            } else {
                console.log("Success deleted");
            }
        });
        res.redirect("/");
    } else {
        List.findOneAndUpdate(
            { name: listName },
            { $pull: { items: { _id: idWork } } },
            (err, foundList) => {
                if (err) {
                    console.error(err);
                } else {
                    res.redirect(`/${listName}`);
                }
            }
        );
    }
});

app.listen(3000, () => {
    console.log("Server listening on port 3000");
});
