/**
 * About Page Script for BananaPrep
 * Handles team member display and timeline initialization
 */

// Team member data
const teamMembers = [
    {
      name: "Alexander Totah",
      title: "Founder & Software Developer",
      description: "Undergraduate Electrical Engineering and Computer Science student with a passion for teaching and learning. He specializes in control systems and robotics.",
      initials: "AT"
    },
    {
      name: "Yvon Kim",
      title: "Founder and Lead Software Engineer",
      description: "An expert software engineer with strong background in both front-end and back-end development, focused on creating intuitive user experiences.",
      initials: "YK"
    },
    {
      name: "Joey Yang",
      title: "Expert Advisor",
      description: "Former professor with expertise in signal processing and communications, overseeing our problem database quality.",
      initials: "JY"
    }
  ];
  
  // Timeline data
  const timelineEvents = [
    {
      title: "The Idea",
      date: "April 2023",
      description: "BananaPrep was conceptualized during a study group session when our founders realized the lack of dedicated platforms for engineering problem practice."
    },
    {
      title: "Beta Launch",
      date: "June 2023",
      description: "The first version launched with 100 problem sets, focused on circuit analysis and digital systems."
    },
    {
      title: "University Partnerships",
      date: "October 2023",
      description: "Established partnerships with 5 leading engineering schools to develop curriculum-aligned problem sets."
    },
    {
      title: "Interactive Solutions",
      date: "March 2024",
      description: "Launched our proprietary MATLAB integration for real-time solution verification and feedback."
    },
    {
      title: "Full Platform Release",
      date: "January 2025",
      description: "Official launch with comprehensive coverage across electrical engineering disciplines and advanced learning analytics."
    }
  ];
  
  // Initialize when DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Render team members
    renderTeamMembers();
    
    // Render timeline
    renderTimeline();
  });
  
  /**
   * Render team members on the page
   */
  function renderTeamMembers() {
    const teamGrid = document.getElementById('teamGrid');
    
    if (!teamGrid) return;
    
    teamMembers.forEach(member => {
      const memberElement = createTeamMemberElement(member);
      teamGrid.appendChild(memberElement);
    });
  }
  
  /**
   * Create team member element
   * @param {Object} member - Team member data
   * @returns {HTMLElement} - The team member element
   */
  function createTeamMemberElement(member) {
    const memberElement = document.createElement('div');
    memberElement.className = 'team-member';
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = member.initials;
    
    const name = document.createElement('h3');
    name.textContent = member.name;
    
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = member.title;
    
    const description = document.createElement('p');
    description.textContent = member.description;
    
    memberElement.appendChild(avatar);
    memberElement.appendChild(name);
    memberElement.appendChild(title);
    memberElement.appendChild(description);
    
    return memberElement;
  }
  
  /**
   * Render timeline on the page
   */
  function renderTimeline() {
    const timelineContainer = document.getElementById('timelineContainer');
    
    if (!timelineContainer) return;
    
    timelineEvents.forEach((event, index) => {
      const timelineItem = createTimelineItem(event, index);
      timelineContainer.appendChild(timelineItem);
    });
  }
  
  /**
   * Create timeline item element
   * @param {Object} event - Timeline event data
   * @param {number} index - Index for determining odd/even positioning
   * @returns {HTMLElement} - The timeline item element
   */
  function createTimelineItem(event, index) {
    const timelineItem = document.createElement('div');
    timelineItem.className = 'timeline-item';
    
    const content = document.createElement('div');
    content.className = 'timeline-content';
    
    const title = document.createElement('h3');
    title.textContent = event.title;
    
    const date = document.createElement('div');
    date.className = 'date';
    date.textContent = event.date;
    
    const description = document.createElement('p');
    description.textContent = event.description;
    
    content.appendChild(title);
    content.appendChild(date);
    content.appendChild(description);
    timelineItem.appendChild(content);
    
    return timelineItem;
  }