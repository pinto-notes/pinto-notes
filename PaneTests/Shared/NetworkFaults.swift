import Testing

/// Suites that set the (global) network faults run one at a time. Its suites are in each test
/// target (Network, Collab, and a few top-level files), so each target declares it.
@Suite(.serialized) enum NetworkFaults {}
