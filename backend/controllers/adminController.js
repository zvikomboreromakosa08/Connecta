exports.getUserActivity = async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    const activityData = await Message.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - this.getPeriodMillis(period))
          }
        }
      },
      {
        $group: {
          _id: '$sender',
          messageCount: { $sum: 1 },
          lastActive: { $max: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      }
    ]);

    res.json(activityData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.manageUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, role, departments } = req.body;

    const user = await User.findById(userId);
    
    switch (action) {
      case 'update_role':
        user.role = role;
        break;
      case 'update_departments':
        user.departments = departments;
        break;
      case 'deactivate':
        user.status = 'inactive';
        break;
    }

    await user.save();
    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};