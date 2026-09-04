import { DataTypes } from 'sequelize';
import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';

export default class Migration {
    #migrationsFolder = '';
    #tableName = 'migrations';

    #sequelize;
    #queryInterface;

    constructor(sequelize) {
        console.log('[Migration]', 'init');
        this.#sequelize = sequelize;
        this.#migrationsFolder = path.resolve(
            global.root_path,
            'js/database/migrations'
        );
    }

    get queryInterface() {
        if (this.#queryInterface) return this.#queryInterface;

        this.#queryInterface = this.#sequelize.getQueryInterface();

        return this.#queryInterface;
    }

    async #setup() {
        const tableExsits = await this.queryInterface.tableExists(
            this.#tableName
        );

        if (tableExsits) return;

        await this.queryInterface.createTable(this.#tableName, {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: DataTypes.STRING,
            },
            batch: {
                type: DataTypes.INTEGER,
            },
        });
    }

    getAllMigrations() {
        const files = fs.readdirSync(this.#migrationsFolder, {
            withFileTypes: true,
        });

        return files
            .filter((file) => file.isFile)
            .filter((file) => file.name.endsWith('.js'))
            .filter((file) => this.#isMigrationNameCorrect(file.name))
            .map((file) => file.name)
            .sort((a, b) => {
                const aKey = this.#getMigrationSortKey(a);
                const bKey = this.#getMigrationSortKey(b);
                return aKey.localeCompare(b);
            });
    }

    #getMigrationSortKey(fileName) {
        return fileName.match(/^(\d{4}_\d{2}_\d{2}_\d{6})_.*\.js$/)[1];
    }

    #isMigrationNameCorrect(fileName) {
        return /^\d{4}_\d{2}_\d{2}_\d{6}_.*\.js$/.test(fileName);
    }

    async getLatestBatchNumber() {
        await this.#setup();
        const [rows] = await this.#sequelize.query(
            `SELECT MAX(batch) as batch from ${this.#tableName}`
        );
        return rows[0]['batch'] ?? 0;
    }

    async getExecutedMigrations() {
        await this.#setup();
        const [rows] = await this.#sequelize.query(
            `SELECT * from ${this.#tableName}`
        );
        return rows;
    }

    async getMissingMigrations() {
        const migrations = this.getAllMigrations();
        const executed = (await this.getExecutedMigrations()).map(
            (row) => row.name
        );
        return migrations.filter((file) => !executed.includes(file));
    }

    async getMigrationsForBatch(batch) {
        await this.#setup();
        const [rows] = await this.#sequelize.query(
            `SELECT * from ${this.#tableName} where batch = :batch`,
            {
                replacements: {
                    batch: batch,
                },
            }
        );
        return rows;
    }

    async drop() {
        console.log('[Migration]', 'drop');
        await this.queryInterface.dropAllTables();
    }

    async up() {
        console.log('[Migration]', 'up');
        await this.#setup();
        const batch = (await this.getLatestBatchNumber()) + 1;
        const migrations = await this.getMissingMigrations();

        for (let index = 0; index < migrations.length; index++) {
            const migration = migrations[index];
            console.log('[Migration]', `up - ${migration}`);

            const migrationRuntime = await this.#importMigration(migration);
            await migrationRuntime.up(this.queryInterface);

            await this.#insertMigration(migration, batch);
        }
    }

    async down() {
        console.log('[Migration]', 'down');
        await this.#setup();
        const batch = await this.getLatestBatchNumber();

        if (batch === 0) return;

        const migrations = (await this.getMigrationsForBatch(batch)).reverse();

        for (let index = 0; index < migrations.length; index++) {
            const migration = migrations[index];
            console.log('[Migration]', `down - ${migration.name}`);

            const migrationRuntime = await this.#importMigration(
                migration.name
            );
            await migrationRuntime.down(this.queryInterface);

            await this.#delteMigrationById(migration.id);
        }
    }

    async #importMigration(migration) {
        const migrationScriptPath = path.resolve(
            this.#migrationsFolder,
            migration
        );
        const importedMigration = await import(
            pathToFileURL(migrationScriptPath)
        );

        return importedMigration.default;
    }

    async #insertMigration(name, batch) {
        return await await this.#sequelize.query(
            `INSERT INTO ${this.#tableName} (name, batch) VALUES (:name, :batch) `,
            { replacements: { name: name, batch: batch } }
        );
    }

    async #delteMigrationById(id) {
        return await this.#sequelize.query(
            ` DELETE FROM ${this.#tableName} WHERE id = :id `,
            { replacements: { id: id } }
        );
    }
}
