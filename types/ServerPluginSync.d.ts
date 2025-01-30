/**
 * Server-side representation of the soundworks sync plugin.
 *
 * The constructor should never be called manually. The plugin will be
 * instantiated by soundworks when registered in the `pluginManager`
 *
 * Available options:
 * - `getTimeFunction` {Function} - Function that returns a time in second.
 *  Defaults to `process.hrtime` with an origin set when the plugin starts.
 *  In most cases, you shouldn't have to modify this default behavior.
 *
 * @example
 * server.pluginManager.register('sync', pluginSync);
 */
export default class ServerPluginSync {
    /** @hideconstructor */
    constructor(server: any, id: any, options: any);
    options: any;
    _sync: any;
    /** @private */
    private start;
    /** @private */
    private addClient;
    /** @private */
    private removeClient;
    /**
     * Time of the local clock. If no arguments provided, returns the current
     * local time, else performs the conversion between the given sync time
     * and the associated local time.
     *
     * @note: server-side, `getLocalTime` and `getSyncTime` are identical
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
     * @note: server-side, `getLocalTime` and `getSyncTime` are identical
     *
     * @param {Number} [localTime] - optional, time from the local clock (sec).
     * @return {Number} Sync time corresponding to the given local time (sec).
     */
    getSyncTime(localTime?: number): number;
}
//# sourceMappingURL=ServerPluginSync.d.ts.map