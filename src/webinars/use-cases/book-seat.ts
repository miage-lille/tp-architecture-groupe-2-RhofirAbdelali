import { IMailer } from 'src/core/ports/mailer.interface';
import { Executable } from 'src/shared/executable';
import { User } from 'src/users/entities/user.entity';
import { IUserRepository } from 'src/users/ports/user-repository.interface';
import { IParticipationRepository } from 'src/webinars/ports/participation-repository.interface';
import { IWebinarRepository } from 'src/webinars/ports/webinar-repository.interface';
import { Participation } from '../entities/participation.entity';
import { WebinarNotEnoughSeatsException } from '../exceptions/webinar-not-enough-seats';

type Request = {
  webinarId: string;
  user: User;
};
type Response = void;

export class BookSeat implements Executable<Request, Response> {
  constructor(
    private readonly participationRepository: IParticipationRepository,
    private readonly userRepository: IUserRepository,
    private readonly webinarRepository: IWebinarRepository,
    private readonly mailer: IMailer
  ) {}

  async execute({ webinarId, user }: Request): Promise<Response> {
    const webinar = await this.webinarRepository.findById(webinarId);
    if (!webinar) throw new Error('Webinar not found');

    if (webinar.hasNotEnoughSeats()) {
      throw new WebinarNotEnoughSeatsException();
    }

    const participations = await this.participationRepository.findByWebinarId(webinarId);
    if (participations.some(part => part.props.userId === user.props.id)) {
      throw new Error(`User ${user.props.id} is already registered for the webinar.`);
    }

    const participation = new Participation({ userId: user.props.id, webinarId });
    await this.participationRepository.save(participation);

    webinar.props.remainingSeats -= 1;

    const organizer = await this.userRepository.findById(webinar.props.organizerId);
    if (organizer) {
      await this.mailer.send({
        to: organizer.props.email,
        subject: 'New Participant',
        body: `User ${user.props.email} has successfully registered for the webinar "${webinar.props.title}".`,
      });
    }
  }
}
