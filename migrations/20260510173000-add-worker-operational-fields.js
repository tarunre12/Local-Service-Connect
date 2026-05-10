'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('workers', 'completion_rate', {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 1.0,
    });
    await queryInterface.addColumn('workers', 'response_time', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 5,
    });
    await queryInterface.addColumn('workers', 'cancellation_rate', {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0.0,
    });
    await queryInterface.addColumn('workers', 'vehicle_info', {
      type: Sequelize.STRING(200),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('workers', 'vehicle_info');
    await queryInterface.removeColumn('workers', 'cancellation_rate');
    await queryInterface.removeColumn('workers', 'response_time');
    await queryInterface.removeColumn('workers', 'completion_rate');
  },
};
