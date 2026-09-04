import { DataTypes } from 'sequelize';

export default {
    async up(queryInterface) {
        await queryInterface.createTable('frames', {
            id: {
                type: DataTypes.STRING(100),
                allowNull: false,
                primaryKey: true,
            },
            status: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
                allowNull: false,
            },
            lastseen: {
                type: DataTypes.DATE,
            },
            ip: {
                type: DataTypes.STRING(100),
            },
            mode: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
                allowNull: false,
            },
            showing_ref: {
                type: DataTypes.STRING(100),
            },
            showing_id: {
                type: DataTypes.BIGINT,
            },
            showing_data: {
                type: DataTypes.STRING,
            },
            showing_updated: {
                type: DataTypes.DATE,
            },
            source_ref: {
                type: DataTypes.STRING(100),
            },
            source_id: {
                type: DataTypes.BIGINT,
            },
            controller_ref: {
                type: DataTypes.STRING(100),
            },
            controller_id: {
                type: DataTypes.BIGINT,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
                allowNull: false,
            },
            updated_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
                onUpdate: DataTypes.NOW,
                allowNull: false,
            },
        });
    },
    async down(queryInterface) {
        await queryInterface.dropTable('frames');
    },
};
