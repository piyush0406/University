import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import moment from "moment";
import { ConnectToDatabase } from "../helpers/db-helper.js";

const router = express.Router();

const conn = await ConnectToDatabase();
const sessionCol = conn.db("University").collection("sessions");
const userCol = conn.db("University").collection("users");

router.get("/free-sessions", authenticateToken, async (req, res) => {
    try {
        if (req.user.access_type != "student") {
            return res.status(403).json("Not Authorised");
        }
        const deans_doc = await userCol.find({ designation: "dean" }).toArray();
        console.log({ deans_doc });
        const dean_list = deans_doc.map((i) => i.universityId);
        let slots = [
            moment().startOf("day").day(4).hour(10).unix(),
            moment().startOf("day").day(5).hour(10).unix()
        ];
        console.log({ slots });
        const booked_slot_map = {};
        const slot_doc = await sessionCol
            .aggregate([
                {
                    $match: {
                        booked_for: {
                            $in: dean_list
                        },
                        slot_time: {
                            $in: slots
                        }
                    }
                }
            ])
            .toArray();

        slot_doc.forEach((i) => {
            booked_slot_map[i.booked_for] = booked_slot_map[i.booked_for]
                ? booked_slot_map[i.booked_for]
                : {};
            booked_slot_map[i.booked_for][i.slot_time] = 1;
        });

        const result = [];
        deans_doc.forEach((i) => {
            slots.forEach((j) => {
                let booked = 1;
                if (booked_slot_map[i.universityId]) {
                    if (booked_slot_map[i.universityId][j]) booked = 0;
                }
                result.push({
                    slot_time: j,
                    dean_name: i.name,
                    dean_id: i.universityId,
                    isSlotAvailable: Boolean(booked)
                });
            });
        });

        console.log({ result });
        res.json({ sessions: result });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching free sessions");
    }
});

// Book a session
router.post("/book-session", authenticateToken, async (req, res) => {
    try {
        if (req.user.access_type != "student") {
            return res.status(403).json("Not Authorised");
        }
        const { slot_time, dean_id } = req.body;
        const isSlotAvailable = await sessionCol.findOne({
            slot_time: Number(slot_time),
            booked_for: dean_id
        });
        let slots = {
            [moment().startOf("day").day(4).hour(10).unix()]: 1,
            [moment().startOf("day").day(5).hour(10).unix()]: 1
        };
        if (isSlotAvailable) {
            return res.status(400).json({ error: "slot_time_already_booked" });
        }
        if (!(slot_time in slots)) {
            return res.status(400).json({ error: "invalid_slot_time" });
        }
        if (
            !(await userCol.findOne({
                universityId: dean_id,
                designation: "dean"
            }))
        ) {
            return res.status(400).json({ error: "invalid booking details" });
        }

        await sessionCol.insertOne({
            booked_by: req.user.universityId,
            slot_time: Number(slot_time),
            booked_for: dean_id,
            end_time: Number(slot_time) + 3600
        });
        res.status(200).json({ message: "Session booked successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error booking session");
    }
});

router.get("/get-sessions", authenticateToken, async (req, res) => {
    try {
        if (req.user.access_type != "teacher") {
            return res.status(403).json("Not Authorised");
        }
        const session_doc = await sessionCol
            .aggregate([
                {
                    $match: {
                        booked_for: req.user.universityId,
                        slot_time: {
                            $gte: moment().unix()
                        }
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "booked_by",
                        foreignField: "universityId",
                        as: "user_detail"
                    }
                },
                {
                    $unwind: {
                        path: "$user_detail",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        booked_by: 1,
                        booked_for: 1,
                        slot_time: 1,
                        student_name: "$user_detail.name",
                        end_time: 1,
                        _id: 0
                    }
                }
            ])
            .toArray();
        console.log({ session_doc });
        res.status(200).json({ sessions: session_doc });
    } catch (err) {
        res.status(500);
    }
});

export default router;