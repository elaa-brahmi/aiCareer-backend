const UserModel = require('../models/user')
const resetMonthlyUploads = async() =>{
    try {
        const users = await UserModel.findAll({
          where: {
            status: 'inactive',
            plan: 'free',
          }
        });
        if (users.length === 0) {
          console.log('No users found');
          return { message: 'No  users found' };
        }
    
        for (const user of users) {
          user.uploads_this_month = 0;
          await user.save();
        
        }
    
        return {
          message: `${users.length} users reset uploads this month`,
          count: users.length
        };
      } catch (error) {
        console.error('Error resetting uploads this month:', error.message);
        throw new Error('Error while verifying resetting uploads');
      }
}
module.exports={resetMonthlyUploads}