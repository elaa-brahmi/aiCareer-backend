const UserModel = require('../models/user');
const SignUpSchema = require('../schemas/signUpSchema');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { Op } = require('sequelize');
const {sendPlanExpiredEmail} = require('../mailer/sendMail')
const {sequelize,testConnection} = require('../config/db');

const signUp = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    const { error } = SignUpSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    const existingUser = await UserModel.findOne({ where: { email } });
    if (existingUser) {
        return res.status(400).json({ message: "User having this email already exists" });
    }
    //create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserModel.create({ firstName, lastName, email, password_hash: hashedPassword });
    console.log('user created', user)
    const accessToken = jwt.sign({ id: user.id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "30d" });
    //update user with accessToken
    user.accessToken = accessToken;
    await user.save();
    //return user and accessToken
    return res.status(200).json({ message: "User created successfully", accessToken, user });
}
const login = async (req, res) => {
    console.log('=== LOGIN METHOD REACHED ===');
    console.log('Request body:', req.body);
    const { email, password } = req.body;
    console.log('Email:', email, 'Password length:', password?.length);
    
    try{
        console.log('Looking for user with email:', email);
        const user = await UserModel.findOne({ where: { email } });
        console.log('User found:', user ? 'YES' : 'NO');
        
        if (!user) {
            console.log('User not found, returning 400');
            return res.status(400).json({ message: "User not found" });
        }
        
        console.log('Comparing password...');
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        console.log('Password valid:', isPasswordValid);
        
        if (!isPasswordValid) {
            console.log('Invalid password, returning 400');
            return res.status(400).json({ message: "Invalid password" });
        }
        
        console.log('Generating JWT token...');
        console.log('ACCESS_TOKEN_SECRET exists:', Boolean(process.env.ACCESS_TOKEN_SECRET));
        
        if (!process.env.ACCESS_TOKEN_SECRET) {
            throw new Error('ACCESS_TOKEN_SECRET environment variable is not set');
        }
        
        const accessToken = jwt.sign({ id: user.id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "30d" });
        console.log('JWT token generated successfully',accessToken);
        
        user.accessToken = accessToken;
        await user.save();
        console.log('User saved with token');
        
        return res.status(200).json({ message: "User logged in successfully", accessToken, user });
    }
    catch(error){
        console.log('=== ERROR IN LOGIN ===');
        console.log('Error type:', typeof error);
        console.log('Error message:', error.message);
        console.log('Error stack:', error.stack);
        return res.status(400).json({message:"error while logging in", error: error.message})
    }
}
const OauthLogin = async (req, res) => {
    try {
        let { provider, providerId, email, name, avatar_url } = req.body;
        
        if(!provider || !providerId){
            return res.status(400).json({message:'missing provider or providerId'});
        }

        providerId = providerId.toString();

        const providerField = provider === "google" ? "google_id" : "github_id";
        
        let user = await UserModel.findOne({ where: { [providerField]: providerId } });

        if (!user && email) {
            user = await UserModel.findOne({ where: { email } });
            if (user) {
                user[providerField] = providerId;
                await user.save();
            }
        }
        const firstName=name.trim().split(" ")[0]
        const lastName=name.trim().split(" ")[1]


        if (!user) {
            user = await UserModel.create({
                email,
                firstName,
                lastName,
                avatar_url,
                [providerField]: providerId,
            });
        }

        const accessToken = jwt.sign({ id: user.id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "30d" });
        user.accessToken = accessToken;
        await user.save();

        return res.status(200).json({ accessToken, user });
    } catch(error) {
        console.log('error from oauth login', error.message)
        return res.status(400).json({message:"error oauth login", error:error.message})
    }
}
const verifyPlanExpiration = async () => {
    try {
      const now = new Date();
      const expiredUsers = await UserModel.findAll({
        where: {
          status: 'active',
          plan_expires_at: {
            [Op.lte]: sequelize.fn('NOW')
          }
        }
      });
  
      if (expiredUsers.length === 0) {
        console.log('No expired plans found');
        return { message: 'No expired users found' };
      }
  
      for (const user of expiredUsers) {
        user.status = 'inactive';
        user.plan= 'free';
        await user.save();
        await sendPlanExpiredEmail(
            user.email,
            user.firstName,
            "your current plan"
        );
        console.log(`User ${user.id} (${user.email}) deactivated — plan expired at ${user.plan_expires_at}`);
      }
  
      return {
        message: `${expiredUsers.length} users deactivated successfully`,
        count: expiredUsers.length
      };
    } catch (error) {
      console.error('Error verifying plan expiration:', error.message);
      throw new Error('Error while verifying plan expiration');
    }
  };




module.exports = {
    verifyPlanExpiration,
    signUp,
    login,
    OauthLogin,
}