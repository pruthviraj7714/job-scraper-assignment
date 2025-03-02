import express, { Request, Response } from "express";
import prisma from "@repo/db/client";

const app = express();

app.get("/", (req : Request, res : Response) => {
  res.send("Healthy server");
});

app.get("/jobs", async (req: Request, res: Response): Promise<void> => {
  const { company = "", location = "", postedOn = "", page = "1" } = req.query;
  const MAX_PER_PAGE = 10;
  const currentPage = Number(page) || 1;

  try {
    const jobs = await prisma.job.findMany({
      where: {
        ...(company ? { company: company as string } : {}),
        ...(location ? { location: location as string } : {}),
        ...(postedOn ? { postedOn: postedOn as string } : {}),
      },
      skip: MAX_PER_PAGE * (currentPage - 1),
      take: 10,
    });
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

app.listen(3000, () => console.log("server is running on PORT 3000"));
