'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
   return await queryInterface.addColumn('channels', 'game', {
     allowNull: true,
     type: Sequelize.TEXT,
   })
  },

  down: async (queryInterface, Sequelize) => {
    return await queryInterface.removeColumn('channels', 'game')
  }
};
