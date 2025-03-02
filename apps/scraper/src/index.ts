import prisma from "@repo/db/client";
import axios from "axios";
import { AmazonJob, GoogleJob, MicrosoftJob } from "./types";
import crypto from "crypto";

function createJobHash(
  company: string,
  title: string,
  location: string,
  postedDate: string
) {
  const data = `${company}-${title}-${location}-${postedDate}`.toLowerCase();
  return crypto.createHash("sha256").update(data).digest("hex");
}

async function scrapeMicrosoftJobs() {
  try {
    console.log("Scraping Microsoft jobs...");
    const response = await axios.get(
      "https://gcsservices.careers.microsoft.com/search/api/v1/search?l=en_us&pg=1&pgSz=20&o=Relevance&flt=true"
    );

    const jobs = response.data.operationResult.result.jobs;
    console.log(`Found ${jobs.length} Microsoft jobs`);

    const results = await Promise.all(
      jobs.map(async (job: MicrosoftJob) => {
        try {
          const jobHash = createJobHash(
            "Microsoft",
            job.title,
            job.properties.primaryLocation,
            job.postingDate.toString()
          );
          const existingJob = await prisma.job.findFirst({
            where: {
              OR : [
                {
                  jobHash: jobHash,
                },
                {
                  url : `https://careers.microsoft.com/us/en/job/${job.jobId}/${job.title}` 
                }
              ]
            },
          });

          if (!existingJob) {
            return await prisma.job.create({
              data: {
                company: "Microsoft",
                description: job.properties.description,
                location: job.properties.primaryLocation,
                postedOn: job.postingDate,
                title: job.title,
                jobHash: jobHash,
                url: `https://careers.microsoft.com/us/en/job/${job.jobId}/${job.title}`,
              },
            });
          }else if(existingJob.lastUpdated < new Date(existingJob.postedOn)) {
            await prisma.job.update({
              where : {
                id : existingJob.id
              },
              data : {
                lastUpdated : new Date(),
                postedOn : job.postingDate
              }
            })
          }
          return null;
        } catch (error) {
          console.error(`Error processing Microsoft job ${job.title}:`, error);
          return null;
        }
      })
    );

    const newJobs = results.filter((result) => result !== null);
    console.log(`Added ${newJobs.length} new Microsoft jobs`);
  } catch (error) {
    console.error("Error scraping Microsoft jobs:", error);
  }
}

async function scrapeGoogleJobs() {
  try {
    console.log("Scraping Google jobs...");
    const response = await axios.get(
      "https://careers.google.com/api/v3/search/?degree=BACHELORS&degree=MASTERS&degree=DOCTORATE&employment_type=FULL_TIME&jlo=ALL&page=1&sort_by=relevance"
    );

    const jobs = response.data.jobs || [];
    console.log(`Found ${jobs.length} Google jobs`);

    const results = await Promise.all(
      jobs.map(async (job: GoogleJob) => {
        const jobHash = createJobHash(
          "Google",
          job.title,
          job.locations[0]?.display!,
          job.publish_date.toString()
        );
        try {
          const existingJob = await prisma.job.findFirst({
            where: {
              OR: [
                {
                  jobHash: jobHash,
                },
                {
                  url: job.apply_url,
                },
              ],
            },
          });


          if (!existingJob) {
            return await prisma.job.create({
              data: {
                company: "Google",
                description:
                  job.description.intro || "No description available",
                location: job?.locations[0]?.display as string,
                postedOn: job.publish_date,
                title: job.title,
                url: job.apply_url,
                jobHash: jobHash,
              },
            });
          } else if(existingJob.lastUpdated < new Date(job.publish_date)) {
            await prisma.job.update({
              where  :{
                id : existingJob.id
              },
               data : {
                postedOn : job.publish_date,
                lastUpdated : new Date()
               }
            })
          }
          return null;
        } catch (error) {
          console.error(`Error processing Google job ${job.title}:`, error);
          return null;
        }
      })
    );

    const newJobs = results.filter((result) => result !== null);
    console.log(`Added ${newJobs.length} new Google jobs`);
  } catch (error) {
    console.error("Error scraping Google jobs:", error);
  }
}

async function scrapeAmazonJobs() {
  try {
    console.log("Scraping Amazon jobs...");
    const response = await axios.get(
      "https://www.amazon.jobs/en/search.json?base_query=&loc_query=&invalid_location=false&country=&city=&region=&county=&offset=0&result_limit=100&sort=relevant&category=&job_type=Full-Time&business_category[]=amazon-web-services"
    );

    const jobs = response.data.jobs || [];
    console.log(`Found ${jobs.length} Amazon jobs`);

    let newJobCount = 0;
    let updatedJobCount = 0;

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      const jobIndex = i + 1;
      
      const jobHash = createJobHash(
        "Amazon",
        job.title,
        job.location,
        job.posted_date.toString()
      );

      try {
        await prisma.$transaction(async (tx) => {
          const existingJob = await tx.job.findFirst({
            where: {
              OR: [
                { jobHash: jobHash },
                { url: job.url_next_step }
              ]
            },
          });

          if (!existingJob) {
            await tx.job.create({
              data: {
                company: "Amazon",
                description: job.description || "No description available",
                location: job.location,
                postedOn: job.posted_date,
                title: job.title,
                url: job.url_next_step,
                jobHash,
                lastUpdated: new Date(),
              },
            });
            newJobCount++;
          } else {
            const newPostedDate = new Date(job.posted_date);
            const existingPostedDate = new Date(existingJob.postedOn);
            
            if (newPostedDate > existingPostedDate || 
                (existingJob.description !== job.description)) {
              await tx.job.update({
                where: {
                  id: existingJob.id
                },
                data: {
                  description: job.description || "No description available",
                  postedOn: job.posted_date,
                  lastUpdated: new Date()
                }
              });
              updatedJobCount++;
            }
          }
        });
      } catch (error) {
        console.error(`Error processing Amazon job ${jobIndex}/${jobs.length}: ${job.title}`);
        console.error(`Job data: ${JSON.stringify({
          title: job.title,
          location: job.location,
          posted_date: job.posted_date,
          url: job.url_next_step,
          hash: jobHash
        })}`);
        console.error(`Error details: ${error}`);
      }
    }

    console.log(`Added ${newJobCount} new Amazon jobs`);
    console.log(`Updated ${updatedJobCount} existing Amazon jobs`);
    
    return newJobCount + updatedJobCount;
  } catch (error) {
    console.error("Error scraping Amazon jobs:", error);
    return 0;
  }
}

async function main() {
  try {
    // await prisma.job.deleteMany({});

    await scrapeMicrosoftJobs();
    await scrapeGoogleJobs();
    await scrapeAmazonJobs();

    console.log("All jobs scraped successfully");
  } catch (error) {
    console.error("Error in main scraper function:", error);
  } finally {
    console.log("Scheduling next run in 1 hour");
    setTimeout(main, 60 * 60 * 1000);
  }
}

main();
