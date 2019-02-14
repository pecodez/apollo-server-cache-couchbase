import { KeyValueCache } from 'apollo-server-caching';
import couchbase, { PasswordAuthenticator, CouchbaseError } from 'couchbase';
import { promisify } from 'util';
import DataLoader from 'dataloader';


export type CouchbaseCacheOptions = {
	ttl?: number
}

export type CouchbaseCacheConnectionDetails = {
    host: string,
    bucket: string,
    auth: { 
        username: string
        password: string
    }
}

export default class CouchbaseCache implements KeyValueCache {

	readonly bucket: any;
	readonly manager: any;
	readonly defaultOptions: CouchbaseCacheOptions = {
		ttl: 300
	}

	private loader: DataLoader<string, string>;


	constructor (connDetails: CouchbaseCacheConnectionDetails, options?: CouchbaseCacheOptions) {

        const auth: couchbase.PasswordAuthenticator = new PasswordAuthenticator(
            connDetails.auth.username,
            connDetails.auth.password
		);
		
		const cluster: couchbase.Cluster = new couchbase.Cluster(connDetails.host);
		cluster.authenticate(connDetails.auth);

		const bucket: couchbase.Bucket = cluster.openBucket(connDetails.bucket);
		const manager: couchbase.BucketManager = bucket.manager();

		bucket.getMulti = promisify(bucket.getMulti).bind(bucket);
		bucket.upsert = promisify(bucket.upsert).bind(bucket);
		bucket.remove = promisify(bucket.remove).bind(bucket);
		bucket.disconnect = promisify(bucket.disconnect).bind(bucket);
		manager.flush = promisify(manager.flush).bind(manager);

		this.bucket = bucket;
		this.manager = manager;

		this.bucket.on('connect', () => {
			console.log('CouchbaseCache connected');
		});

		this.bucket.on('error', (err: CouchbaseError) => {
			console.log(err);
		});
		
		this.loader = new DataLoader((keys: string[]) => {
			return this.bucket.getMulti(keys);
		}, {
			cache: false
		});

	}

	/**
	 * Sets a cache entry
	 * @param key
	 * @param value
	 * @param options
	 */
	async set (key: string, value: string, options?: { ttl?: number }): Promise<void> {

		const { ttl } = Object.assign({}, this.defaultOptions, options);
		await this.bucket.upsert(key, value, { 'expiry': ttl });
	}

	/**
	 * Gets a cache entry
	 * @param key
	 * @param value
	 * @param options
	 */
	async get (key: string): Promise<string | undefined> {

		const data = await this.loader.load(key);

		return data || undefined;
	}

	/**
	 * Deletes a cache entry
	 * @param key
	 * @param value
	 * @param options
	 */
	async delete (key: string): Promise<boolean> {

		return await this.bucket.remove(key);
	}

	/**
	 * Flushes the entire cache
	 * @param key
	 * @param value
	 * @param options
	 */
	async flush(): Promise<void> {

		await this.manager.flush();
	}
}