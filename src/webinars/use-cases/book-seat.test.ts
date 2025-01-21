import { BookSeat } from './book-seat';
import { InMemoryWebinarRepository } from '../adapters/webinar-repository.in-memory';
import { InMemoryParticipationRepository } from '../adapters/participation-repository.in-memory';
import { InMemoryMailer } from '../../core/adapters/in-memory-mailer';
import { Webinar } from '../entities/webinar.entity';
import { User } from '../../users/entities/user.entity';
import { WebinarNotEnoughSeatsException } from '../exceptions/webinar-not-enough-seats';
import { Participation } from '../entities/participation.entity';


describe('BookSeat Use Case', () => {
  let bookSeat: BookSeat;
  let webinarRepo: InMemoryWebinarRepository;
  let participationRepo: InMemoryParticipationRepository;
  let mailer: InMemoryMailer;

  beforeEach(() => {
    webinarRepo = new InMemoryWebinarRepository();
    participationRepo = new InMemoryParticipationRepository();
    mailer = new InMemoryMailer();

    const userRepoMock = {
      findById: jest.fn(async (userId: string) => {
        return new User({ id: userId, email: `${userId}@example.com`, password: 'password' });
      }),
    };

    bookSeat = new BookSeat(participationRepo, userRepoMock, webinarRepo, mailer);
  });

  it('should book a seat successfully', async () => {
    const webinar = new Webinar({
      id: 'webinar1',
      organizerId: 'organizer1',
      title: 'Webinar Test',
      startDate: new Date(),
      endDate: new Date(),
      seats: 10,
      remainingSeats: 10,
    });

    webinarRepo.create(webinar);

    const user = new User({ id: 'user1', email: 'user1@example.com', password: 'password' });

    await bookSeat.execute({ webinarId: 'webinar1', user });

    const savedWebinar = await webinarRepo.findById('webinar1');
    expect(savedWebinar?.props.remainingSeats).toBe(9);
    expect(mailer.sentEmails).toHaveLength(1);
    expect(mailer.sentEmails[0]).toEqual({
      to: 'organizer1@example.com',
      subject: 'New Participant',
      body: `User user1@example.com has successfully registered for the webinar "Webinar Test".`,
    });
  });

  it('should throw an error if no seats are available', async () => {
    const webinar = new Webinar({
      id: 'webinar2',
      organizerId: 'organizer2',
      title: 'Full Webinar',
      startDate: new Date(),
      endDate: new Date(),
      seats: 10,
      remainingSeats: 0,
    });

    webinarRepo.create(webinar);

    const user = new User({ id: 'user2', email: 'user2@example.com', password: 'password' });

    await expect(bookSeat.execute({ webinarId: 'webinar2', user })).rejects.toThrow(WebinarNotEnoughSeatsException);
  });

  it('should throw an error if user is already registered', async () => {
    const webinar = new Webinar({
      id: 'webinar3',
      organizerId: 'organizer3',
      title: 'Duplicate Registration',
      startDate: new Date(),
      endDate: new Date(),
      seats: 10,
      remainingSeats: 10,
    });

    webinarRepo.create(webinar);

    const user = new User({ id: 'user3', email: 'user3@example.com', password: 'password' });

    participationRepo.save(new Participation({ userId: 'user3', webinarId: 'webinar3' }));

    await expect(bookSeat.execute({ webinarId: 'webinar3', user })).rejects.toThrow('User user3 is already registered for the webinar.');
  });

  it('should send an email to the organizer after successful booking', async () => {
    const webinar = new Webinar({
      id: 'webinar4',
      organizerId: 'organizer4',
      title: 'Notification Test',
      startDate: new Date(),
      endDate: new Date(),
      seats: 10,
      remainingSeats: 10,
    });

    webinarRepo.create(webinar);

    const user = new User({ id: 'user4', email: 'user4@example.com', password: 'password' });

    await bookSeat.execute({ webinarId: 'webinar4', user });

    expect(mailer.sentEmails).toHaveLength(1);
    expect(mailer.sentEmails[0]).toEqual({
      to: 'organizer4@example.com',
      subject: 'New Participant',
      body: `User user4@example.com has successfully registered for the webinar "Notification Test".`,
    });
  });
});