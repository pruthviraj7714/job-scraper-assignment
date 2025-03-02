

export interface MicrosoftJob {
    jobId: string;
    title: string;
    postingDate: Date;
    properties: {
      description: string;
      locations: string[];
      primaryLocation: string;
      workSiteFlexibility: string;
      profession: string;
      discipline: string;
      jobType: string;
      roleType: string;
      employmentType: string;
      educationLevel: string;
    };
  }
  
export interface GoogleJob {
    id: string;
    title: string;
    publish_date: string;
    apply_url: string;
    description: {
      intro: string;
    };
    locations: Array<{
      display: string;
    }>;
  }
  
export interface AmazonJob {
    id: string;
    title: string;
    posted_date: string;
    job_path: string;
    location: string;
    description: string;
    job_category: string;
    job_schedule_type: string;
  }
  