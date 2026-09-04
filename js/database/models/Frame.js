import { DataTypes, Model } from 'sequelize';

class Frame extends Model {
    static mfInitModel(sequelize) {
        this.init(
            {
                id: {
                    type: DataTypes.STRING(100),
                    allowNull: false,
                    primaryKey: true,
                },
                status: {
                    type: DataTypes.INTEGER,
                    defaultValue: 0,
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
            },
            {
                sequelize,
                tableName: 'frames',
                timestamps: true,
                underscored: true,
            }
        );
    }
}

export default Frame;
