const express = require('express')
const fileUpload = require("express-fileupload");
const app = express()
const cors = require('cors')
require('dotenv').config()
const ObjectId = require('mongodb').ObjectId;
var MongoClient = require('mongodb').MongoClient;
const { v4: uuidv4 } = require('uuid');
const { async } = require('@firebase/util');
const port = process.env.PORT || 5000;


var uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ymryghc.mongodb.net/test`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const superAdminKey = `${process.env.SUPER_ADMIN_KEY}`;

app.use(cors());
app.use(express.json());
app.use(fileUpload());

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-credentials", "true");
    res.setHeader("Acces-Control-Allow-Origin", "*");
    res.setHeader(
      "Acces-Control-Allow-Header", 
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token"
    );
    res.setHeader('Acces-Control-Allow-Methods', "GET,OPTIONS, POST, DELETE, PUT, PATCH");
    next();
  })


const decode = (secret, ciphertext) => {
    const dec = [];
    const enc = Buffer.from(ciphertext, 'base64').toString('binary');
    for (let i = 0; i < enc.length; i += 1) {
      const keyC = secret[i % secret.length];
      const decC = `${String.fromCharCode((256 + enc[i].charCodeAt(0) - keyC.charCodeAt(0)) % 256)}`;
      dec.push(decC);
    }
    return dec.join('');
  };


  const encode = (secret, plaintext) => {
    const enc = [];
    for (let i = 0; i < plaintext.length; i += 1) {
      const keyC = secret[i % secret.length];
      const encC = `${String.fromCharCode((plaintext[i].charCodeAt(0) + keyC.charCodeAt(0)) % 256)}`;
      enc.push(encC);
    }
    const str = enc.join('');
    return Buffer.from(str, 'binary').toString('base64');
  };

  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  }


async function server() {
    try{
        await client.connect();
        const database = client.db('ourdb');                         // Database Name 
        const usersCollection = database.collection('user');
        const galleryCollection = database.collection('all_gallery');
        const noteoneCollection = database.collection('noteone');
        const notetwoCollection = database.collection('notetwo');
        console.log('Database Connected');

        app.get('/user', async(req, res) => {
            const user = await usersCollection.find({}).toArray();
            res.json(user);
        })

        app.post('/user', async(req, res) => {
            const user = await usersCollection.insertOne(req.body);
            res.json(user);
        })

        app.post('/gallery', async(req, res) => {
            const cursor = await galleryCollection.insertOne(req.body);
            res.json(cursor);
        })

        app.get('/gallery', async(req, res) => {
            const query = {"secret":false};
            const user = await galleryCollection.find(query).toArray();
            res.json(user);
        })

        app.get('/secret', async(req, res) => {
            const query = {"secret":true};
            const user = await galleryCollection.find(query).toArray();
            res.json(user);
        })

        app.get('/userid', async(req, res) => {
            const filter = {email:req?.query?.email};
            const user = await usersCollection.find(filter).toArray();
            res.json(user);
        })

        app.post("/uploads", async(req, res) => {
            const buffer = Buffer.from(req?.files?.file?.data);
            const pictureCollection = database.collection(req?.body?.gallery);
            let base64String = buffer?.toString('base64');
            const encodedb64 = encode(req?.body?.secret ,base64String);
            const cursor = await pictureCollection.insertOne({name: req?.files?.file?.name, b64: encodedb64});
            res.send(cursor);
        })

        app.post("/noteone", async(req, res) => {
            const textdata = encodeURI(req?.body?.text);
            const datedata = encodeURI(req?.body?.date);
            const encodedbone = encode(req?.body?.secret , textdata);
            const encodedate = encode(req?.body?.secret, datedata);
            const payload = {"date" : encodedate , "story": encodedbone};
            const cursor = await noteoneCollection.insertOne(payload);
            res.json(cursor);
        })

        app.post("/notetwo", async(req, res) => {
            const textdata = encodeURI(req?.body?.text);
            const datedata = encodeURI(req?.body?.date);
            const encodedbone = encode(req?.body?.secret , textdata);
            const encodedate = encode(req?.body?.secret, datedata);
            const payload = {"date" : encodedate , "story": encodedbone};
            const cursor = await notetwoCollection.insertOne(payload);
            res.json(cursor);
        })

        app.post('/noteoneshow', async(req, res) => {
            let data = await noteoneCollection.find({}).toArray();
            const secretcode = req?.body?.codeno;
            let i = 0;
            if(data?.length){
                for(i; i < data?.length; i++){
                    const decoded = decode(secretcode, data[i].story);
                    data[i].story = decoded.toString();
                    const decodeddate = decode(secretcode, data[i].date);
                    data[i].date = decodeddate;
                }
                if(i === data?.length){
                    res.status(200).json(data);
                } else {
                    res.status(200).json("Not Found");
                }
            }
            return;
        })

        app.post('/notetwoshow', async(req, res) => {
            let data = await notetwoCollection.find({}).toArray();
            const secretcode = req?.body?.codeno;
            let i = 0;
            if(data?.length){
                for(i; i < data?.length; i++){
                    const decoded = decode(secretcode, data[i].story);
                    data[i].story = decoded.toString();
                    const decodeddate = decode(secretcode, data[i].date);
                    data[i].date = decodeddate;
                }
                if(i === data?.length){
                    res.status(200).json(data);
                } else {
                    res.status(200).json("Not Found");
                }
            }
            return;
        })

        app.post('/dlen', async(req, res) => {
            const pictureCollection = database.collection(req.body?.gallery);
            const len = await pictureCollection.find({}).toArray();
            res.json(len?.length);
        })

        app.post('/picture', async(req, res) => {
            const pictureCollection = database.collection(req.body?.gallery);
            const data = await pictureCollection.find({}).skip(req?.body?.start).limit(req?.body?.limit).toArray();
            const secretcode = req?.body?.secret;
            let i = 0;
            if(data.length){
                for(i; i < data?.length; i++){
                    const decoded = decode(secretcode, data[i].b64);
                    data[i].b64 = decoded;
                }
                if(i === data.length){
                    res.status(200).json(data);
                } else {
                    res.status(200).json("No Picture Found");
                }
            }
            return;
        })

        app.get('/memory', async(req, res) => {  
            database.command({ dbStats: 1 }, (err, stats) => {
            if (err) {
              console.error('Error retrieving database statistics:', err);
              return;
            }
            const totalSpace = stats.storageSize;
            const availSpace = stats.storageSize - stats.dataSize;
            const response = {totalSpace:formatBytes(totalSpace), availSpace:formatBytes(availSpace)};
            res.json(response);
          });
        })
    }
    finally {
            // await client.close();
        }
    }
    
    app.get('/', (req, res) => {
      res.send(`API Rinning On Port : ${port}`)
    })


    server().then(() => {
        app.listen(port, () => {
            console.log(`Example app listening at Port No : ${port}`);
        })
    }).catch(console.dir)
