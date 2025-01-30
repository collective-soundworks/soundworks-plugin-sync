/**
 * Client-side representation of the soundworks sync plugin.
 *
 * The constructor should never be called manually. The plugin will be
 * instantiated by soundworks when registered in the `pluginManager`
 *
 * Available options:
 * - `getTimeFunction` {Function} - Function that returns a time in second.
 *  Defaults to `performance.now` is available or `Date.now` on browser clients,
 *  and `process.hrtime` on node clients, all of them with an origin set when
 *  the plugin starts.
 * - `[onReport=null]` {Function} - Function to execute when the synchronization
 *  reports some statistics.
 * - `[syncOptions={}]` {Object} - Options to pass to the underlying sync client
 *  cf. @link{https://github.com/ircam-ismm/sync?tab=readme-ov-file#new_SyncClient_new}
 *
 * @example
 * client.pluginManager.register('sync', ClientPluginSync, {
 *   getTimeFunction: () => audioContext.currentTime,
 * });
 */
export default class ClientPluginSync {
    /** @hideconstructor */
    constructor(client: any, id: any, options: any);
    options: any;
    /**
     * Time of the local clock. If no arguments provided, returns the current
     * local time, else performs the conversion between the given sync time
     * and the associated local time.
     *
     * @param {Number} [syncTime] - optional, time from the sync clock (sec).
     * @return {Number} Local time corresponding to the given sync time (sec).
     */
    getLocalTime(syncTime?: number): number;
    /**
     * Time of the synced clock. If no arguments provided, returns the current
     * sync time, else performs the conversion between the given local time
     * and the associated sync time.
     *
     * @param {Number} [audioTime] - optional, time from the local clock (sec).
     * @return {Number} Sync time corresponding to the given local time (sec).
     */
    getSyncTime(localTime: any): number;
    /** @private */
    private start;
    _sync: any;
    stop(): Promise<void>;
    /**
     * Subscribe to reports from the sync process.
     * See [https://github.com/ircam-ismm/sync#SyncClient..reportFunction](https://github.com/ircam-ismm/sync#SyncClient..reportFunction)
     * @param {Function} callback
     */
    onReport(callback: Function): () => any;
    /**
     * Get last statistics from the synchronization process.
     * See [https://github.com/ircam-ismm/sync#SyncClient..reportFunction](https://github.com/ircam-ismm/sync#SyncClient..reportFunction)
     * @return {Object} The last report
     */
    getReport(): any;
    #private;
}
//# sourceMappingURL=ClientPluginSync.d.ts.map