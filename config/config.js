/* Magic Frame Config Sample
 *
 * By Speidy674 https://speidy674.de
 * MIT Licensed.
 */
let config = {
	address: "0.0.0.0",
	port: 8080,

	//serveronly stuff
	ipWhitelist: [],
	
	useHttps: false, 		// Support HTTPS or not, default "false" will use HTTP
	httpsPrivateKey: __dirname+"/../CA/key.pem", 	// HTTPS private key path, only require when useHttps is true
	httpsCertificate: __dirname+"/../CA/cert.pem", 	// HTTPS Certificate path, only require when useHttps is true

	//helment config https://helmetjs.github.io/
	httpHeaders: { contentSecurityPolicy: false, crossOriginOpenerPolicy: false, crossOriginEmbedderPolicy: false, crossOriginResourcePolicy: false, originAgentCluster: false },

	// ┌────────────── second (optional)
	// │ ┌──────────── minute
	// │ │ ┌────────── hour
	// │ │ │ ┌──────── day of month
	// │ │ │ │ ┌────── month
	// │ │ │ │ │ ┌──── day of week
	// * * * * * *
   

	intervalFileList: "*/15 * * * *",
	intervalFrameChange: "*/5 * * * *",

	logLevel: ["INFO", "LOG", "WARN", "ERROR", "DEBUG"] // Add "DEBUG" for even more logging

};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") { module.exports = config; }