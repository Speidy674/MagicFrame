import { DataTypes, Model } from 'sequelize';

class FrameSetting extends Model {
    static mfInitModel(sequelize) {
        this.init(
            {
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
            },
            {
                sequelize,
                tableName: 'frame_settings',
                timestamps: true,
                underscored: true,
            }
        );
    }
}

export default FrameSetting;
