const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const sentimentScoreType = sequelize.getDialect() === 'postgres'
    ? DataTypes.JSONB
    : DataTypes.JSON;

  const Review = sequelize.define('Review', {
    id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    bookingId:      { type: DataTypes.UUID, allowNull: false, unique: true },
    customerId:     { type: DataTypes.UUID, allowNull: false },
    workerId:       { type: DataTypes.UUID, allowNull: false },
    rating:         { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
    comment:        { type: DataTypes.TEXT, allowNull: true },
    sentiment:      { type: DataTypes.ENUM('POSITIVE', 'NEGATIVE', 'NEUTRAL', 'MIXED'), allowNull: true },
    sentimentScore: { type: sentimentScoreType, allowNull: true },
  }, { tableName: 'reviews', underscored: true });

  Review.associate = (models) => {
    Review.belongsTo(models.Booking,  { foreignKey: 'bookingId',  as: 'booking'  });
    Review.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
    Review.belongsTo(models.Worker,   { foreignKey: 'workerId',   as: 'worker'   });
  };

  return Review;
};
