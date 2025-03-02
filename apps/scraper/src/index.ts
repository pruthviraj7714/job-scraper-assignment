import prisma from "@repo/db/client";
import axios from "axios";
import { AmazonJob, GoogleJob, MicrosoftJob } from "./types";

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
          const existingJob = await prisma.job.findFirst({
            where: {
              company: "Microsoft",
              title: job.title,
              postedOn: job.postingDate,
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
                url: `https://careers.microsoft.com/us/en/job/${job.jobId}`,
              },
            });
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
        try {
          const existingJob = await prisma.job.findFirst({
            where: {
              company: "Google",
              title: job.title,
              location:
                job.locations && job.locations.length > 0
                  ? job?.locations[0]?.display
                  : "Unknown",
            },
          });

          if (!existingJob) {
            return await prisma.job.create({
              data: {
                company: "Google",
                description:
                  job.description.intro || "No description available",
                location: job?.locations[0]?.display as string,
                postedOn: new Date(job.publish_date),
                title: job.title,
                url: job.apply_url,
              },
            });
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

    const results = await Promise.all(
      jobs.map(async (job: AmazonJob) => {
        try {
          const existingJob = await prisma.job.findFirst({
            where: {
              company: "Amazon",
              title: job.title,
              location: job.location || "Unknown",
              postedOn: job.posted_date,
            },
          });

          if (!existingJob) {
            return await prisma.job.create({
              data: {
                company: "Amazon",
                description: job.description || "No description available",
                location: job.location,
                postedOn: new Date(job.posted_date),
                title: job.title,
                url: `https://www.amazon.jobs${job.job_path}`,
              },
            });
          }
          return null;
        } catch (error) {
          console.error(`Error processing Amazon job ${job.title}:`, error);
          return null;
        }
      })
    );

    const newJobs = results.filter((result) => result !== null);
    console.log(`Added ${newJobs.length} new Amazon jobs`);
  } catch (error) {
    console.error("Error scraping Amazon jobs:", error);
  }
}

async function main() {
  try {
    await prisma.job.deleteMany({});

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
