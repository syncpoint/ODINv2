##### Readme? Why?
<Sidebar/> has a ton of user interactions and is just freaking complex. <Sidebar/> is a component that does not fit in your head (at least not mine.) This readme as an attempt to document individual requirements along with relevant implementation details. Readme is a living document (as they say) which is written in lock-step with the code.

OK, baby, let's roll!

##### REQ-01: Display list of cards from search result
The information to be displayed as a list of cards is pulled from the database. The search terms consist of two parts: A search scope and additional filter criteria entered by the user. Search scope may be as simple as `'@layer'` or as complex as `'@feature @link !feature:${layerId} !link+layer:${layerId}'`. The last translates to the following: Limit search scope to features and links and only consider object with ids starting either with `feature:${layerId}` or `link+layer:${layerId}`. As a result all children for a specific layer are included in the search result, i.e. all features and links for this layer. Additional criteria from the user may contain tags (#) and simple terms. Example for a query `'@feature #own #unit mech inf'`.

##### REQ-01.a: Last search is persistent
Whenever <Sidebar/> is mounted, the last search result is displayed. Instead of storing the result in memory, we opt to persist the last search itself. Thus last search result can also be restored after a restart of the application. When no last search is available yet, scope is set to ` '@layer'` and filter to the empty string `''`.

##### REQ-01.b: Update search result when necessary
Current search result is updated whenever search index is refreshed (transitively through database) or certain preferences are changed (e.g. coordinates format). In both cases a new query is performed. To reduce complexity of Sidebar logic, search index provides a query interface where current query provides new search results automatically through a callback.

##### Tactics

By applying certain tactics we hope to improve the code structure and thus maintainability. If a tactic should fail to achieve a certain goal, at least it should be understood and documented why this approach failed. 

##### T-1: Don't over-engineer

Components used for <Sidebar/> are only used in this very context. We don's strive to come up with reusable components from the very beginning. <Tag/> for example might be useful in other contexts at some time, but for now it is very specific to the needs of <Sidebar/>.

...





Requirements

* REQ-07: Thousands of entries are to be displayed fast (virtual list).
* REQ-08: Multi-select (focus follow selection) model/strategy is used.
* REQ-09: (Full) keyboard operation is supported.
* REQ-10:


Sidebar has a ton of user interactions.
Sidebar is complex.