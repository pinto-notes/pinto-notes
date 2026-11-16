import SwiftUI

/// Voting and the timer, at the top of the board while either is on (BoardTeam): how many votes
/// you have left (the host also sees how many are in, and ends it), the totals once it ended, and
/// the timer counting down to "Time's up". Native, calm: one capsule, words and numbers, the
/// host's buttons in it. Under the follow banner when that shows.
struct CanvasTeamBar: View {
    let canvas: CanvasController
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        let team = canvas.team
        VStack {
            if team.running {
                bar(team)
                    .padding(.top, canvas.followBanner == nil ? 12 : 12 + BoardFollowUI.height + 8)
                    .transition(.opacity)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .animation(reduceMotion ? nil : .easeOut(duration: 0.2), value: team.running)
    }

    private func bar(_ team: BoardTeamModel) -> some View {
        HStack(spacing: 16) {
            if let v = team.voting { voting(team, v) }
            if team.timer != nil { timer(team) }
        }
        .padding(.horizontal, 14)
        .frame(minHeight: 36)
        .background(.regularMaterial, in: .capsule)
        .shadow(color: .black.opacity(0.12), radius: 8, y: 2)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("canvas.team.bar")
    }

    @ViewBuilder private func voting(_ team: BoardTeamModel, _ v: BoardTeam.Voting) -> some View {
        HStack(spacing: 8) {
            if v.results != nil {
                Image(systemName: "chart.bar")
                    .foregroundStyle(.secondary)
                Text(BoardTeam.results(team.resultsTotal))
                    .font(.system(size: 13, weight: .semibold))
                    .accessibilityIdentifier("canvas.team.results")
                if team.hosting {
                    button(BoardTeam.done, id: "canvas.team.clearVotes") { team.clearVoting() }
                }
            } else {
                Circle()
                    .fill(BoardCommentUI.color(canvas.teamColors(team.me).light))
                    .frame(width: 10, height: 10)
                    .accessibilityHidden(true)
                Text(team.canVote ? BoardTeam.votesLeft(team.votesLeft) : BoardTeam.voting)
                    .font(.system(size: 13, weight: .semibold))
                    .monospacedDigit()
                    .accessibilityIdentifier("canvas.team.votesLeft")
                if team.hosting {
                    Text(BoardTeam.votesIn(team.votesIn))
                        .font(.system(size: 13))
                        .foregroundStyle(.secondary)
                        .monospacedDigit()
                        .accessibilityIdentifier("canvas.team.votesIn")
                    button(BoardTeam.endVoting, id: "canvas.team.endVoting") { team.endVoting() }
                } else if let name = team.hostName {
                    Text(BoardTeam.hostedBy(name))
                        .font(.system(size: 13))
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    private func timer(_ team: BoardTeamModel) -> some View {
        HStack(spacing: 8) {
            Image(systemName: team.finished ? "bell" : "timer")
                .foregroundStyle(team.finished ? Color.paneAccent : .secondary)
            TimelineView(.periodic(from: .now, by: 1)) { context in
                Text(team.finished ? BoardTeam.timesUp : BoardTeam.clock(team.timeLeft(at: context.date)))
                    .font(.system(size: 13, weight: .semibold))
                    .monospacedDigit()
                    .contentTransition(.numericText(countsDown: true))
                    .accessibilityIdentifier("canvas.team.clock")
            }
            if team.hosting {
                button(team.finished ? BoardTeam.done : "Stop", id: "canvas.team.stopTimer") { team.stopTimer() }
            }
        }
    }

    private func button(_ title: String, id: String, action: @escaping () -> Void) -> some View {
        Button(title, action: action)
            .buttonStyle(.hoverText)
            .font(.system(size: 13, weight: .medium))
            .accessibilityIdentifier(id)
    }
}
