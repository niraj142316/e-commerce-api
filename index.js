const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
const allowedOrigins = ['http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));


// Database connection with MongoDB
mongoose.connect("mongodb+srv://nirajpc1416:Ihatesorries14@first-cluster.iptv9nr.mongodb.net/e-commerce");

// Image storage engine
const storage = multer.diskStorage({
  destination: path.join(__dirname, '/upload/images'),
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage: storage });

app.use('/images', express.static(path.join(__dirname, '/upload/images')));

// Schema for Creating products
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  new_price: { type: Number, required: true },
  old_price: { type: Number, required: true },
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);

// API for adding a product
app.post('/addproduct', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API for removing a product
app.post('/removeproduct', async (req, res) => {
  try {
    await Product.findOneAndDelete({ _id: req.body.id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API for getting all products
app.get('/allproducts', async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Schema for user model
const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, unique: true },
  password: { type: String },
  cartData: { type: Object },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Middleware to fetch user
const fetchUser = async (req, res, next) => {
  try {
    const token = req.header('auth-token');
    if (!token) {
      throw new Error("Please authenticate using a valid token");
    }
    const decoded = jwt.verify(token, 'secret_ecom');
    req.user = await User.findById(decoded.user.id);
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: error.message });
  }
};

// API for registering a user
app.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) {
      throw new Error("Existing user found with the same email address");
    }
    const newUser = new User({ name, email, password });
    await newUser.save();
    const token = jwt.sign({ user: { id: newUser._id } }, 'secret_ecom');
    res.json({ success: true, token });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// API for user login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      throw new Error("Invalid email or password");
    }
    const token = jwt.sign({ user: { id: user._id } }, 'secret_ecom');
    res.json({ success: true, token });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Server listening
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
