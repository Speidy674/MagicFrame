import { DataTypes } from 'sequelize';

export default {
    async up(queryInterface) {
        await queryInterface.createTable('frame_settings', {
            frame_id: {
                type: DataTypes.STRING(100),
                allowNull: false,
                primaryKey: true,

                references: {
                    model: 'frames',
                    key: 'id',
                },

                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            muted: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
                allowNull: false,
            },
            volume: {
                type: DataTypes.INTEGER,
                defaultValue: 50,
                allowNull: false,
            },
            interval: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
                allowNull: false,
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
        await queryInterface.dropTable('frame_settings');
    },
};
