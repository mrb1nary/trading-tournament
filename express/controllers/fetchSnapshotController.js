
import { UserAssetSnapshot } from "../models/userSnapshotModel.js";
import { Competition } from "../models/competitionModel.js";

export const fetchSnapshotController = async (req, res) => {
  try {
    const { wallet_address, competition_id } = req.body;

    // Validate required parameters
    if (!wallet_address) {
      return res.status(400).json({
        success: false,
        message: "Wallet address is required",
      });
    }

    // Build query object
    const query = { wallet_address };

    // Add competition filter if provided
    if (competition_id) {
      // Find the competition by ID
      const competition = await Competition.findOne({ id: competition_id });
      if (!competition) {
        return res.status(404).json({
          success: false,
          message: "Competition not found",
        });
      }
      query.competition = competition._id;
    }

    // Find snapshots for the wallet address
    const snapshots = await UserAssetSnapshot.find(query)
      .populate({
        path: "competition",
        select: "id name start_time end_time entry_fee",
      })
      .populate({
        path: "player",
        select: "player_username player_wallet_address",
      })
      .sort({ "startSnapshot.snapshot_timestamp": -1 });

    if (snapshots.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No snapshots found for this wallet address",
      });
    }

    // Format response data
    const formattedSnapshots = snapshots.map((snapshot) => {
      // Calculate portfolio changes
      const startValue = snapshot.startSnapshot?.total_portfolio_value || 0;
      const endValue = snapshot.endSnapshot?.total_portfolio_value || 0;
      const valueDifference = endValue - startValue;
      const percentageChange =
        startValue > 0 ? (valueDifference / startValue) * 100 : 0;

      return {
        snapshot_id: snapshot._id,
        competition: {
          id: snapshot.competition?.id,
          name: snapshot.competition?.name,
          start_time: snapshot.competition?.start_time,
          end_time: snapshot.competition?.end_time,
          entry_fee: snapshot.competition?.entry_fee,
        },
        player: {
          username: snapshot.player?.player_username,
          wallet_address: snapshot.player?.player_wallet_address,
        },
        start_snapshot: {
          timestamp: snapshot.startSnapshot?.snapshot_timestamp,
          assets: snapshot.startSnapshot?.assets || [],
          total_value: startValue,
        },
        end_snapshot: {
          timestamp: snapshot.endSnapshot?.snapshot_timestamp,
          assets: snapshot.endSnapshot?.assets || [],
          total_value: endValue,
        },
        performance: {
          value_change: valueDifference,
          percentage_change: percentageChange.toFixed(2),
          has_complete_data: Boolean(
            snapshot.startSnapshot && snapshot.endSnapshot
          ),
        },
      };
    });

    return res.status(200).json({
      success: true,
      message: "Snapshots retrieved successfully",
      count: snapshots.length,
      data: formattedSnapshots,
    });
  } catch (error) {
    console.error("Error fetching snapshots:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch snapshots",
      error: error.message,
    });
  }
};
