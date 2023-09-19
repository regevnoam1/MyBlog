const express = require('express');
const {v4: uuidv4} = require('uuid');
const cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const cors = require('cors');

const {baseUrl, maxNumOfClapsPerUserPerPost} = require('../constants');
const {Posts} = require('./model/Posts');
const {Tags} = require('./model/Tags');

const app = express();
const port = 3080;
app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(cors());
let idCounter=55;
const userPosts = {};
const corsOptions = {
    origin: `${baseUrl.client}`,
    credentials: true,
};

app.get('/', cors(corsOptions), (req, res) => {
    res.send('Welcome to your Wix Enter exam!');
});

app.get('/user', cors(corsOptions), (req, res) => {
    const userId = req.cookies?.userId || uuidv4();
    res.cookie('userId', userId).send({id: userId});
});

///////////////////////////////////// Posts /////////////////////////////////////
app.get('/posts', cors(corsOptions), (req, res) => {
    console.log(req.url)
    console.log('req.query', req.query);
    let filteredPosts = Posts;
    if (req.query.popularity) {
        const popularity = Number(req.query.popularity);
        filteredPosts = filteredPosts.filter((post) => post.popularity >= popularity);
    }
    if (req.query.tag) {
        const tag = req.query.tag;
        if (Tags.hasOwnProperty(tag)) {
            const subKeys = Object.keys(Tags[tag]);
            filteredPosts = filteredPosts.filter((post) => subKeys.includes(post.id));
        }
    }
    res.send({ Posts: filteredPosts });
});

app.post('/add-new-post', cors(corsOptions), (req, res) => {
    const userId = req.cookies?.userId;
    if (!userId) {
        res.status(400).end();
        return;
    }
    const { post } = req.body;
    const { title, content, tag } = post;
    if (!title || !content || !tag) {
        res.status(400).end();
        return;
    }
    if (title.length > 100) {
        res.status(400).end();
        return; // The Bonus - title length should be less than 100 chars.
    }

    const newPost = {
        id: idCounter.toString(),
        title,
        content,
        userId,
        popularity: 0,
    };
    idCounter++;
    Posts.push(newPost);
    Tags[tag][newPost.id] = true;
    res.send({ Posts }).status(200).end().redirect('/');
});

///////////////////////////////////// Tags /////////////////////////////////////
app.get('/tags', cors(corsOptions), (req, res) => {
    res.send({Tags});
});

app.post('/tags/tagName/:tagName', cors(corsOptions), (req, res) => {
    const userId = req.cookies?.userId;
    if (!userId) {
        res.status(403).end();
        return;
    }
    const {tagName} = req.params;
    if (Tags[tagName]) {
        res.status(400).end();
        return;
    }
    Tags[tagName] = {};
    res.send({Tags}).status(200).end();
});

//ADDED BY ME - ADD POST TO TAGS!
app.post('/addTag', cors(corsOptions), (req, res) => {
    const {curPost, selectedOption} = req.body.tagToADD;
    if (!curPost || !selectedOption) {
        res.status(400).end();
        return;
    }
    if (!Tags[selectedOption]) {
        res.status(400).end();
        return;
    }
    Tags[selectedOption][curPost] = true;
    res.send({Tags}).status(200).end();
});

//Maximum 5 Claps per User!!!
app.post('/clap', cors(corsOptions), (req, res) => {
    const {postId, userId, didUserClappedOnPost} = req.body.user;
    if (!userId || !postId) {
        res.status(400).end();
        return;
    }
    const post = Posts.find((post) => post.id === postId);
    if (!post) {
        res.status(404).end();
        return;
    }
    console.log(didUserClappedOnPost)
    if (didUserClappedOnPost === "true") {
        if (!userPosts[userId]) {
            userPosts[userId] = {posts: [postId]};
            post.popularity++;
            res.send({Posts}).status(200);
        }
        const userPost = userPosts[userId].posts.find((post) => post === postId);
        if (!userPost) {
            if (userPosts[userId].posts.length >= maxNumOfClapsPerUserPerPost) {
                console.log(userPosts[userId].posts)
                res.status(400).end();
            }
            userPosts[userId].posts.push(postId);
            post.popularity++;
        }
    } else {
        removeClap(post, userId, postId);
    }
    res.send({Posts}).status(200);
});
const removeClap = (post, userId, postId) => {
    if (!userPosts[userId]) {
        return;
    }
    const userPost = userPosts[userId].posts.find((post) => post === postId);
    if (userPost) {
        userPosts[userId].posts = userPosts[userId].posts.filter((post) => post !== postId);
        post.popularity--;
    }
}


app.post('/clapFilter', cors(corsOptions), (req, res) => {
    const {userId} = req.body.user;
    console.log(userId)
    console.log(userPosts)
    if (userPosts.hasOwnProperty(userId)) {
        const postIds = userPosts[userId].posts;
        const filteredPosts = Posts.filter((post) => postIds.includes(post.id));
        console.log(filteredPosts)
        res.send({Posts: filteredPosts}).status(200);
        return;
    }
    console.log("no match user")
    res.send({Posts}).status(200);
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
