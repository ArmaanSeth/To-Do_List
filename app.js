const express=require("express")
const bodyParser=require("body-parser")
const mongoose=require("mongoose")
const _=require("lodash")

const app=express()

app.set("view engine","ejs")
app.use(express.static("public"))
app.use(bodyParser.urlencoded({extended:true}))


mongoose.connect("mongodb+srv://admin-armaan:hkvaps2a2@cluster0.psmqhid.mongodb.net/todolistDB").then(()=>console.log("Connected to database")).catch((err)=>console.log(err));

const week=["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]

const itemSchema={
    name:{
        type:String,
        required:[true,"You have not entered any item!"]
    }
}

const listSchema={
    name:String,
    items:[itemSchema]
}

const Item=mongoose.model("Item",itemSchema)
const List=mongoose.model("List",listSchema)


const item1=new Item({
    name:"Welcome to your todolist!"
})
const item2=new Item({
    name:"Hit the + button to add a new item."
})
const item3=new Item({
    name:"<-- Hit this to delete an item."
})
const defaultItems=[item1,item2,item3]



app.get("/",function(req,res){

    let options={
        weekday:"long",
        day:"numeric",
        month:"long"
    }
    let today=new Date()
    let day=today.toLocaleDateString("en-US",options)

    Item.find().then((items)=>{
        if( items.length===0){
            Item.insertMany(defaultItems).then(()=>{
                console.log("Successfully added default items to the DB.")
            });
            res.redirect("/")
        }else{
            res.render("list",{listTitle:day,newListItem:items})
        }
    });    
})


app.get("/:customListName",function(req,res){
    const listName=_.capitalize(req.params.customListName)
    List.findOne({name:listName}).then((list)=>{
        if(!list){
            const item=new List({
                name:listName,
                items:defaultItems
            })
            item.save()
            res.redirect("/"+listName)
        }else{
            res.render("list",{listTitle:listName,newListItem:list.items})
        }
    })
})



app.post("/",function(req,res){
    const item=new Item({
        name:req.body.newItem
    })
    
    console.log(_.kebabCase(req.body.name))
    if(week.includes(_.kebabCase(req.body.name))){
        item.save()
        res.redirect("/")
    }else{
        List.findOne({name:req.body.name}).then((list)=>{
            list.items.push(item)
            list.save()
            res.redirect("/"+list.name)
        })
    }
})


app.post("/delete",function(req,res){
    const name=req.body.name
    const itemId=req.body.itemId
    console.log(_.kebabCase(req.body.name))
    if(week.includes(_.kebabCase(req.body.name))){
        Item.findByIdAndDelete(itemId,{}).then(()=>console.log("Successfuly deleted checked item."))
        res.redirect("/")
    }else{
        List.findOneAndUpdate({name:name},{$pull:{items:{_id:itemId}}}).then((list)=>{
            console.log(list)
        })
        res.redirect("/"+name)
    }
    
})


app.listen(3000,function(){
    console.log("Server is running at port 3000")
})
