'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
   return await queryInterface.addColumn('users', 'subscriptions', {
     allowNull: false,
     type: Sequelize.ARRAY(Sequelize.TEXT),
   })
  },

  down: async (queryInterface, Sequelize) => {
    return await queryInterface.removeColumn('users', 'subscriptions')
  }
};
