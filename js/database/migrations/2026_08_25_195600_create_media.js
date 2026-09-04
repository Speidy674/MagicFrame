import { DataTypes } from 'sequelize';

export default {
    async up(queryInterface) {
        await queryInterface.createTable('media', {
            id: {
                type: DataTypes.BIGINT,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            path: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            type: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            mime_type: {
                type: DataTypes.STRING(150),
                allowNull: false,
            },
            size: {
                type: DataTypes.BIGINT,
                allowNull: false,
            },
            width: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            height: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            duration: {
                type: DataTypes.INTEGER,
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
            deleted_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        });

        await queryInterface.addIndex('media', ['path', 'name'], {
            unique: true,
        });
    },
    async down(queryInterface) {
        await queryInterface.removeIndex('media', ['path', 'name']);
        await queryInterface.dropTable('media');
    },
};
