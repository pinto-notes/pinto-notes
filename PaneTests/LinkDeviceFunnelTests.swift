import Foundation
import Testing
@testable import Pane

extension FunnelTests {
    /// The link-device funnel (`link_device_step`), on both devices: each step once, where it happens.
    @MainActor @Suite struct LinkDeviceFunnel {
        let flow = AddDeviceFlowTests()

        @Test func scanningAndAddingSaysEachStepOnceOnBothDevices() async throws {
            let steps = FunnelSteps()
            try await steps.watch {
                let (a, _) = await flow.firstDevice()
                let (b, _) = await flow.newDevice()
                let shown = try await flow.showCode(flow.session(b))
                let c = try await AddDeviceApproval.find(.scanned(shown.qr), user: flow.user, server: flow.server)
                try await AddDeviceApproval.approve(c, key: try #require(a.keyToHandOver), user: flow.user, device: flow.phone, server: flow.server)
                await shown.task.value
                for x in [a, b] { x.signedOut() }
            }
            for step in [LinkStep.shown, .codeShown, .done] { #expect(steps.count(.linkDeviceStep(.newDevice, step)) == 1, "new device \(step)") }
            for step in [LinkStep.scanned, .approved, .done] { #expect(steps.count(.linkDeviceStep(.existingDevice, step)) == 1, "existing device \(step)") }
            #expect(steps.count(.linkDeviceStep(.existingDevice, .typed)) == 0)
            #expect(!steps.events.contains { if case .linkDeviceStep(_, .failed, _) = $0 { true } else if case .linkDeviceStep(_, .gaveUp, _) = $0 { true } else { false } })
        }

        @Test func aTypedCodeSaysTypedAndATypoSaysFailed() async throws {
            let steps = FunnelSteps()
            await steps.watch {
                _ = try? await AddDeviceApproval.find(.typed("not a code"), user: flow.user, server: flow.server)
            }
            #expect(steps.count(.linkDeviceStep(.existingDevice, .typed)) == 1)
            #expect(steps.count(.linkDeviceStep(.existingDevice, .failed, kind: .other)) == 1)
        }

        @Test func closingTheScreenBeforeTheKeyComesIsGivingUp() async throws {
            let steps = FunnelSteps()
            try await steps.watch {
                // The account has its key on a first device; this one waits for it.
                let (a, _) = await flow.firstDevice()
                let (b, _) = await flow.newDevice()
                let shown = try await flow.showCode(flow.session(b))
                // The screen goes away before the key came.
                shown.task.cancel()
                await shown.task.value
                for x in [a, b] { x.signedOut() }
            }
            #expect(steps.count(.linkDeviceStep(.newDevice, .shown)) == 1)
            #expect(steps.count(.linkDeviceStep(.newDevice, .codeShown)) == 1)
            #expect(steps.count(.linkDeviceStep(.newDevice, .gaveUp)) == 1)
        }
    }
}
