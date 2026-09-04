import { DataTypes, Model } from 'sequelize';

class Media extends Model {
    static mfInitModel(sequelize) {
        this.init(
            {
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
            },
            {
                sequelize,
                tableName: 'media',
                timestamps: true,
                underscored: true,
                paranoid: true,
            }
        );
    }
}

export default Media;
